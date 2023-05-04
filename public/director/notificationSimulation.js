const axios = require("axios");

module.exports.main = async (config) => {

  let initDate = new Date(config.initialDate);
  let finalDate = new Date(config.finalDate);

  config.notificationConfig = await axios.get('https://assets.bluejay.governify.io/api/v1/public/director/notification-config.json').then((res) => res.data).catch(() => undefined)

  if (!config.notificationConfig) {
    console.log("Notification config not found")
    return;
  }

  config.historieMax = config.notificationConfig.messages.reduce((acc, message) => {
    if (message.history && message.history > acc) {
      acc = message.history;
    }
    return acc
  }, 0)
  try {
    config.days = Math.round((new Date() - initDate) / (1000 * 60 * 60 * 24)) + 1;
    let days = Math.round((finalDate - initDate) / (1000 * 60 * 60 * 24)) + 1;
    if(config.slackHook){
        config.hooks = {
            slack: config.slackHook
        }
    }else{
        config.hooks = await getHooksUrls(config);
    }
    config.states = await getStates(config);
    for (let i = 0; i < days; i++) {
      if(!config.secondsPerDay || config.secondsPerDay <= 0){
          config.secondsPerDay = 0.1
      }
      await new Promise(resolve => setTimeout(resolve, config.secondsPerDay * 1000));
      let to = new Date(initDate.getTime() + i * (1000 * 60 * 60 * 24))
      to.setHours(23, 59, 59, 999)
      notificatePeriod(config, to, config.historieMax)
    }
  } catch (error) {
    console.log(error)
  }
  
return '';
}

async function getHooksUrls(config) {
  const requestURL = 'http://scopes.bluejay.governify.io/api/v1/scopes/development/' + config.classId + '/' + config.projectId;
  let notifications = []
  await axios.get(requestURL).then((response) => {
    notifications = response.data.scope.notifications
  }).catch((error) => {
    console.log("Error obtainig Urls");
    throw new Error(error);
  });

  return notifications
}

async function getStates(config) {
  let requestURL = 'https://registry.bluejay.governify.io/api/v6/agreements/tpa-' + config.projectId;
  let result = {}

  await axios.get(requestURL).then(async (response) => {
    const guarantees = response.data.terms.guarantees.map(guarantee => { return { id: guarantee.id, desc: guarantee.description, valueFunc: guarantee.of[0].objective.split(' >=')[0] } })
    for (let guarantee of guarantees) {
      result[guarantee.id] = { desc: guarantee.desc, valueFunc: guarantee.valueFunc };
      requestURL = 'https://registry.bluejay.governify.io/api/v6/states/tpa-' + config.projectId + '/guarantees/'
        + guarantee.id + '?' + new URLSearchParams({ lasts: (config.days + config.historieMax)*2,evidences:'false',withNoEvidences:'false'});
      console.log(requestURL)
      await axios.get(requestURL).then((response) => {
        result[guarantee.id].states = response.data
      })
        .catch(() => {
          throw new Error("Error obtainig guarantee" + guarantee);
        });
    }
  }).catch((err) => {
    console.log("Error obtainig guarantees");
  });

  return result;
}

function notificatePeriod(config, to, length) {

  let passedGuarantees = 0
  let bodyText = ''

  for (let guarantee in config.states) {
    
    let states = config.states[guarantee].states.filter(state => new Date(state.period.to) <= to).sort((a, b) => new Date(b.period.to) - new Date(a.period.to)).splice(0, length)
    let stateMessage;
    if (states[0]?.record?.value) passedGuarantees += 1;

    if (states && states.length > 0) {
      stateMessage = getStateMessage(config.states[guarantee], states, config)
    } else {
      stateMessage = { message: 'There is no states for this guarantee yet', emoji: '❗' }
    }
    bodyText += ' • ' + stateMessage.emoji + config.states[guarantee].desc + ' ➜ ' + stateMessage.message + '\n';
  }

  let bodyPost = {
    blocks: [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `The simulation value for ${to.toISOString().substring(0, 10)}`,
        }
      },
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `Your team is fullfiling ${passedGuarantees} out of ${Object.keys(config.states).length}:`
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": bodyText
          }
        ]
      }
    ]
  };

  for (let key in config.hooks) {
    axios.post(config.hooks[key], bodyPost).catch(() => {
      console.log('Error sending feedback to ' + key)
    })
  }
}

function getStateMessage(guarantee, states, config) {
  let stateMessage = undefined
  let actualState = states[0].record.value ? 'ok' : 'nok';
  let mTime = config.notificationConfig['N' + actualState]
  let actualMTime = states.findIndex(element => states[0].record.value !== element.record.value)
  if (actualMTime === -1) {
    actualMTime = states.length
  }
  if (actualMTime >= mTime) {
    actualState = 'm' + actualState
  }
  let condition = actualMTime === 1 || actualMTime === mTime ? 'onEnter' : 'onStay'

  let messages = config.notificationConfig.messages.filter(message => message.state === actualState && message.condition === condition)

  let histories = new Set(messages.map(message => message.history).filter(Boolean).sort((a, b) => b - a))
  for (let history of histories) {
    if (actualMTime >= history) {
      let evolution = calculateEvolution(guarantee, states, history)
      stateMessage = messages.filter(message => message.history === history && message.evolution === evolution.evolution && message.threshold <= evolution.percentageChange)[0]
    }
    if (stateMessage) break
  }
  if (!stateMessage) stateMessage = messages.filter(message => message.evolution === 'stalled' || message.condition === 'onEnter')[0]
  return stateMessage
}

function calculateEvolution(guarantee, states, history) {
  let func = guarantee.valueFunc
  let metrics = Object.keys(states[0].record.metrics)
  metrics.forEach(metric => {
    func = func.replace(metric, `states[0].record.metrics.${metric}`)
  })
  let evolution = 'increasing'
  let percentageChange = (eval(func) - eval(func.replace(/\[0\]/g, '[history - 1]')))
  if (percentageChange < 0) {
    evolution = 'decreasing'
    percentageChange = Math.abs(percentageChange)
  }
  return { evolution, percentageChange }
}