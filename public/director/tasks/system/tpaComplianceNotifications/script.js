const axios = require('axios');
module.exports.main = async (config) => {
	let result={date: new Date(), log:[]}; log=(data)=>result.log.push(data);
    try {    
    //SCRIPT BEGIN
        if(config.forAdmin) {// summary of all groups for admins
            log('Processing admin data');
        } else { // for specific group
            log('Processing group data');
            const tpaResult = getTpaResultForGroup(config.groupId);
            const formatedResult = formatResultForEmail(tpaResult)
            await sendTpaComplianceEmail({notificatorUrl: config.urls.notificator, email: config.email, tpaResultInMD: formatedResult});
            log('TPA compliance email sent');
        }
    //SCRIPT END
    } catch (error) {
        return { error: error.stack.split('\n').slice(0,3), log: result.log };
    }
	return result;
}


async function getTpaResultForGroup({registryUrl, projectId}) {
    const requestURL = registryUrl + projectId;
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
    return `TPA result for group ${groupId}`;
}

function formatResultForEmail(tpaResult) {
    return `**Hola que pasa**, ${tpaResult}`
}

async function sendTpaComplianceEmail({notificatorUrl, email, tpaResultInMD}) {
    try {
        await axios.post(notificatorUrl, {
            to: email,
            subject: "TPA Compliance Result",
            text: tpaResultInMD,
            html: tpaResultInMD,
            isMarkdown: true
    });
    } catch (error) {
        log(error)
    }
    
}