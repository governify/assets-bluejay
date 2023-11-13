const axios = require("axios");

module.exports.main = async (config) => {

  let initDate = new Date(config.initialDate);
  let finalDate = new Date(config.finalDate);

  config.notificationConfig = await axios.get(config.urls.assets + '/api/v1/public/director/notification-config.json').then((res) => res.data).catch(() => undefined)

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
    if (config.slackHook) {
      config.hooks = {
        slack: config.slackHook
      }
    } else {
      config.hooks = await getHooksUrls(config);
    }
    config.states = await getStates(config);
    let to = new Date();
    to.setHours(23, 59, 59, 999)
    notificatePeriod(config, to, config.historieMax)
  } catch (error) {
    console.log(error)
  }

  return '';
}

async function getHooksUrls(config) {
  const requestURL = config.urls.scopes + '/api/v1/scopes/development/' + config.classId + '/' + config.projectId;
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
  let requestURL = config.urls.registry + '/api/v6/agreements/tpa-' + config.projectId;
  let result = {}

  await axios.get(requestURL).then(async (response) => {
    const guarantees = response.data.terms.guarantees.map(guarantee => { return { id: guarantee.id, desc: guarantee.description, valueFunc: guarantee.of[0].objective.split(' >=')[0] } })
    for (let guarantee of guarantees) {
      result[guarantee.id] = { desc: guarantee.desc, valueFunc: guarantee.valueFunc };
      requestURL = config.urls.registry + '/api/v6/states/tpa-' + config.projectId + '/guarantees/'
        + guarantee.id + '?' + new URLSearchParams({ lasts: (config.days + config.historieMax) * 2, evidences: 'false', withNoEvidences: 'false' });
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
  let bodyText = '<br>\n'

  for (let guarantee in config.states) {

    let states = config.states[guarantee].states.filter(state => new Date(state.period.to) <= to).sort((a, b) => new Date(b.period.to) - new Date(a.period.to)).splice(0, length)
    let stateMessage;
    if (states[0]?.record?.value) passedGuarantees += 1;

    if (states && states.length > 0) {
      stateMessage = getStateMessage(config.states[guarantee], states, config)
    } else {
      stateMessage = { message: 'There is no states for this guarantee yet', emoji: '❗' }
    }
    bodyText += ' • ' + stateMessage.emoji + config.states[guarantee].desc + ' ➜ ' + stateMessage.message + '<br>\n';
  }

  let bodyPost = (key, forAdmin) => ({
    blocks: [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `Bluejay status for ${to.toISOString().substring(0, 10)}`,
        }
      },
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `${forAdmin ? ("Team '" + config.projectName + "' from " + config.classId) : ("Your team '" + config.projectName + "'")} is fullfiling ${passedGuarantees} out of ${Object.keys(config.states).length}:`
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": bodyText === "" ? "No guarantees yet" : bodyText
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*View your dashboard <${config.urls.dashboard}/dashboard/script/dashboardLoader.js?dashboardURL=${config.urls.reporter}/api/v4/dashboards/tpa-${config.projectId}/main|here>* (credentials: user/bluejay).`
        }
      }
    ]
  });


  for (let key in config.hooks) {
    axios.post(config.hooks[key], bodyPost(key, config.forAdmin)).catch((err) => {
      console.log('Error sending feedback to ' + key)
    })
  }
  if (config.email) { //for admin you
    const sgMail = require('@sendgrid/mail')
    let textFromBody = bodyPost("", config.forAdmin).blocks.map(b=>{
      if(b.text?.text) return b.text.text
      return b.elements[0].text
    }).join('\r')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
      to: config.email, 
      from: 'governify.auditor@gmail.com', 
      subject: 'Bluejay results',
      text: textFromBody.replace("<br>",""),
      html: _convertBlocksToHTML(bodyPost("", config.forAdmin).blocks)
    }

    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
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
function _convertBlocksToHTML(blocks) {
  let htmlString = '';

  blocks.forEach(block => {
    switch (block.type) {
      case 'header':
        htmlString += `<b>${block.text.text}</b>`;
        break;
      case 'context':
        htmlString += `<div>${block.elements[0].text}</div>`;
        break;
      case 'section':
        htmlString += `<b>${block.text.text}</b>`.replace("*View your dashboard <",`View your dashboard <a href="`).replace("|here>*",`"> here</a>`);;
        break;
      default:
        break;
    }
  });

  return htmlString;
}