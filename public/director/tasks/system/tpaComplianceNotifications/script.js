let result = { date: new Date(), log: [] }; log = (data) => result.log.push(data);
const axios = require('axios');
module.exports.main = async (scriptConfig) => {
    try {
        // SCRIPT START
        log({ message: "Script configuration", obj: {...scriptConfig} });
        let { additionalStatesToFetch } = scriptConfig;

        let evolutionMessages = await axios.get(scriptConfig.urls.assets + '/api/v1/public/director/notification-config.json').then((res) => res.data).catch((error) => {
            log({ message: "Error fetching evolution messages", obj: error });
            console.log("Error obtaining evolution messages");
            throw new Error("Error obtaining evolution messages");
        });
        log({ message: "Evolution messages fetched", obj: evolutionMessages });
        if (!evolutionMessages) {
            console.log("Notification config not found");
            return result;
        }

        let maxOfMinNumOfStates = evolutionMessages.messages.reduce((acc, message) => {
            if (message.minNumOfStates && message.minNumOfStates > acc) {
                acc = message.minNumOfStates;
            }
            return acc;
        }, 0);
        log({ message: "Max of minimum number of states", obj: maxOfMinNumOfStates });
        // return result;
        try {
            if (scriptConfig.slackHook) {
                scriptConfig.hooks = {
                    slack: scriptConfig.slackHook
                };
            } else {
                scriptConfig.hooks = await getProjectNotificationFromScopes(scriptConfig);
            }
            log({ message: "Notification hooks", obj: scriptConfig.hooks });

            scriptConfig.states = await getStatesForEachGuarantee(scriptConfig, maxOfMinNumOfStates, additionalStatesToFetch);
            log({ message: "Fetched states for each guarantee", obj: scriptConfig.states });

            sendTpaComplianceNotifications(scriptConfig, maxOfMinNumOfStates, evolutionMessages);
        } catch (error) {
            log({ message: "Error in processing", obj: error });
            console.log(error);
        }
        // SCRIPT END
    } catch (error) {
        log({ message: "Unhandled error", obj: error.stack.split('\n').slice(0, 3) });
        return { error: error.stack.split('\n').slice(0, 3), log: result.log };
    }
    return result;
};


async function getProjectNotificationFromScopes(config) {
    const requestURL = config.urls.scopes + '/api/v1/scopes/development/' + config.classId + '/' + config.projectId;
    log({ message: "Request URL for project notifications", obj: requestURL });
    let notifications = {};
    await axios.get(requestURL).then((response) => {
        notifications = response.data.scope.notifications;
    }).catch((error) => {
        log({ message: "Error fetching project notifications", obj: error });
        console.log("Error obtainig Urls");
        throw new Error(error);
    });

    log({ message: "Fetched project notifications", obj: notifications });
    return notifications;
}

async function getStatesForEachGuarantee(config, maxOfMinNumOfStates, additionalStatesToFetch = 0) {
    let requestURL = config.urls.registry + '/api/v6/agreements/tpa-' + config.projectId;
    log({ message: "Request URL for agreements", obj: requestURL });
    let result = {};

    await axios.get(requestURL).then(async (response) => {
        const agreementGuarantees = response.data.terms.guarantees.map(guarantee => { return { id: guarantee.id, desc: guarantee.description, valueFunc: guarantee.of[0].objective.split(' >=')[0] }; });
        log({ message: "Fetched agreement guarantees", obj: agreementGuarantees });
        for (let agreementGuarantee of agreementGuarantees) {
            result[agreementGuarantee.id] = { desc: agreementGuarantee.desc, valueFunc: agreementGuarantee.valueFunc };
            requestURL = config.urls.registry + '/api/v6/states/tpa-' + config.projectId + '/guarantees/'
                + agreementGuarantee.id + '?' + new URLSearchParams({ lasts: maxOfMinNumOfStates * 2 + additionalStatesToFetch, evidences: 'false', withNoEvidences: 'false' });
            log({ message: "Request URL for states", obj: requestURL });
            await axios.get(requestURL).then((response) => {
                result[agreementGuarantee.id].states = response.data;
            })
                .catch((error) => {
                    log({ message: "Error fetching guarantee states", obj: error });
                    throw new Error("Error obtainig guarantee" + agreementGuarantee);
                });
        }
    }).catch((err) => {
        log({ message: "Error fetching guarantees", obj: err });
        console.log("Error obtainig guarantees");
    });

    log({ message: "Fetched states for guarantees", obj: result });
    return result;
}

function sendTpaComplianceNotifications(config, maxOfMinNumOfStates, evolutionMessages) {
    log({ message: "Sending notifications", obj: { config, maxOfMinNumOfStates, evolutionMessages } });
    let endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    log({ message: "End of today", obj: endOfToday });
    let fulfilledGuaranteesCount = 0;
    let bodyText = '<br>\n';

    for (let guarantee in config.states) {
        log({ message: "Processing guarantee", obj: guarantee });
        let filteredStates = config.states[guarantee]
            .states
            .filter(state => new Date(state.period.to) <= endOfToday)
            .sort((a, b) => new Date(b.period.to) - new Date(a.period.to))
            // We get maxOfMinNumOfStates states (half of them) ordered by most recent first
            .splice(0, maxOfMinNumOfStates);
        log({ message: "Filtered states", obj: filteredStates });

        let guaranteeCompliance;
        if (filteredStates[0]?.record?.value) fulfilledGuaranteesCount += 1;

        if (filteredStates && filteredStates.length > 0) {
            guaranteeCompliance = getMessageBasedOnComplianceEvolution(config.states[guarantee], filteredStates, evolutionMessages);
        } else {
            guaranteeCompliance = { message: 'There is no states for this guarantee yet', emoji: '❗' };
        }
        log({ message: "Guarantee compliance", obj: guaranteeCompliance });
        bodyText += ' • ' + guaranteeCompliance.emoji + config.states[guarantee].desc + ' ➜ ' + guaranteeCompliance.message + '<br>\n';
    }

    log({ message: "Notification body text", obj: { bodyText, fulfilledGuaranteesCount } });

    let bodyPost = (key, forAdmin) => ({
        blocks: [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `Bluejay status for ${endOfToday.toISOString().substring(0, 10)}`,
                }
            },
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `${forAdmin ? ("Team '" + config.projectName + "' from " + config.classId) : ("Your team '" + config.projectName + "'")} is fulfilling ${fulfilledGuaranteesCount} out of ${Object.keys(config.states).length}:`
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

    log({ message: "Body post function", obj: bodyPost });

    for (let key in config.hooks) {
        log({ message: `Sending feedback to ${key}`, obj: bodyPost(key, config.forAdmin) });
    }
    if (config.email) {
        let textFromBody = bodyPost("", config.forAdmin).blocks.map(b => {
            if (b.text?.text) return b.text.text;
            return b.elements[0].text;
        }).join('\r');
        log({ message: `Simulated email sent to ${config.email}`, obj: textFromBody });
    }
}

function getMessageBasedOnComplianceEvolution(guarantee, halfOfStates, evolutionMessages) {
    log({ message: "Evaluating compliance evolution", obj: { guarantee, halfOfStates, evolutionMessages } });
    let stateMessage = undefined;
    let actualState = halfOfStates[0].record.value ? 'ok' : 'nok';
    let sustainedThreshold = evolutionMessages['N' + actualState];
    let unchangedStateCount = halfOfStates.findIndex(element => halfOfStates[0].record.value !== element.record.value);
    if (unchangedStateCount === -1) {
        unchangedStateCount = halfOfStates.length;
    }
    if (unchangedStateCount >= sustainedThreshold) {
        actualState = 'm' + actualState;
    }
    let condition = unchangedStateCount === 1 || unchangedStateCount === sustainedThreshold ? 'onEnter' : 'onStay';

    let messages = evolutionMessages.messages.filter(message => message.state === actualState && message.condition === condition);
    let minNumsOfStates = new Set(messages.map(message => message.minNumOfStates).filter(Boolean).sort((a, b) => b - a));
    log({ message: "Compliance evolution intermediate variables", obj: { actualState, condition, messages, minNumsOfStates } });

    for (let minNumOfStates of minNumsOfStates) {
        if (unchangedStateCount >= minNumOfStates) {
            let evolution = computeTpaComplianceEvolution(guarantee, halfOfStates, minNumOfStates);
            stateMessage = messages.filter(message => message.minNumOfStates === minNumOfStates && message.evolution === evolution.evolution && message.threshold <= evolution.percentageChange)[0];
        }
        if (stateMessage) break;
    }
    if (!stateMessage) stateMessage = messages.filter(message => message.evolution === 'stalled' || message.condition === 'onEnter')[0];
    log({ message: "Final state message", obj: stateMessage });
    return stateMessage;
}

function computeTpaComplianceEvolution(guarantee, states, minNumOfStates) {
    log({ message: "Computing compliance evolution", obj: { guarantee, states, minNumOfStates } });
    let functionString = guarantee.valueFunc;
    let metrics = Object.keys(states[0].record.metrics);
    metrics.forEach(metric => {
        functionString = functionString.replace(metric, `states[0].record.metrics.${metric}`);
    });
    let evolution = 'improving';
    let percentageChange = (eval(functionString) - eval(functionString.replace(/\[0\]/g, '[minNumOfStates - 1]')));
    if (percentageChange < 0) {
        evolution = 'worsening';
        percentageChange = Math.abs(percentageChange);
    }
    log({ message: "Computed evolution and percentage change", obj: { evolution, percentageChange } });
    return { evolution, percentageChange };
}
