"use strict";
const axios = require("axios");

// Use UTC hour
const period = [{ 
    "from": "2020-11-09T00:00:00", 
    "to": "2020-12-07T00:00:00"
}];


module.exports.main = (config) => {
    const requestURL = '$_[infrastructure.internal.reporter.default]/api/v4/contracts/' + config.agreementId + '/createPointsFromPeriods';

    axios.post(requestURL, {periods: period}).then((response) => {
        console.log("Finished points creation for TPA:", config.agreementId);
    }).catch((error) => {
        console.log("Error when creating points for TPA:", config.agreementId, "\n", error);
    });
}

