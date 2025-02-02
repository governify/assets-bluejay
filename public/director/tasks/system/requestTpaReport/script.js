"use strict";
const axios = require("axios");

const today = new Date();
const previousHour = new Date(today - 3600000);

const lastHourPeriods = [
    {
        from: previousHour.toISOString(),
        to: today.toISOString()
    }
];

module.exports.main = (config) => {
    let result = { date: new Date(), log: [] };
    let log = (...data) => {
        result.log.push(data.join(' '));
        console.log(`${Date.now()} -[ReqTpaReport]- ${data.join(' ')}`);
    }
    try {
        //SCRIPT BEGIN
        let periods = config.periods ?? lastHourPeriods;
        const requestURL = '$_[infrastructure.internal.reporter.default]/api/v4/contracts/' + config.agreementId + '/createPointsFromPeriods';
        log(`Creating points for TPA: ${config.agreementId} with periods: ${JSON.stringify(periods)}`);
        axios.post(requestURL, { periods })
            .then(() => {
                log("Requested points creation for TPA:", config.agreementId);
            }).catch((error) => {
                log("Error when creating points for TPA:", config.agreementId, "\n", error);
            });
        //SCRIPT END
    } catch (error) {
        return { error: error.stack.split('\n').slice(0, 3), log: result.log };
    }
    return result;
}