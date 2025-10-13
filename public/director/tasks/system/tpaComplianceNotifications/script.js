const axios = require('axios');
const { InfluxDB } = require('influx');
const governify = require('governify-commons');

let globalInfluxClient = null; // Cliente global Influx

module.exports.main = async (config) => {
	let result={date: new Date(), log:[]}; log=(data)=>result.log.push(data);
    try {    
    //SCRIPT BEGIN
        if(config.forAdmin) {// summary of all groups for admins
            log('Processing admin data');
        } else { // for specific group
            log('Processing group data');
            const tpaData = await axios.get(`${governify.infrastructure.getServiceURL("internal.registry")}/api/v6/agreements/tpa-${config.projectId}`);
            const tpa = tpaData.data;
            const projectData = await axios.get(`${governify.infrastructure.getServiceURL("internal.scopes")}/api/v1/scopes/development/${config.courseId}/${config.projectId}`, 
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': config.scopeManagerKey
                }
            });
            const project = projectData.data;
            const lastestGuaranteeResultsFromInflux = await getTpaResultFromInfluxDB({projectId: config.projectId, tpa: tpa, project: project});
            const formatedResult = formatResultForEmail(lastestGuaranteeResultsFromInflux, project);
            const emails = project.scope.notifications.email;
            const notificatorUrl = governify.infrastructure.getServiceURL("internal.notificator");
            log('Notificator url: ' + notificatorUrl);
            await sendTpaComplianceEmail({notificatorUrl: notificatorUrl, emails: emails, tpaResultInMD: formatedResult});
        }
    //SCRIPT END
    } catch (error) {
        return { error: error.stack.split('\n').slice(0,3), log: result.log };
    }
	return result;
}

function connectToInfluxDB(url) {
    if (globalInfluxClient) {
        return globalInfluxClient;
    }
    const urlObj = new URL(url);
    globalInfluxClient = new InfluxDB({
        host: urlObj.hostname,
        port: Number(urlObj.port) || 5002,
        protocol: urlObj.protocol.replace(':', ''),
        database: 'metrics'
    });
    return globalInfluxClient;
}

async function getTpaResultFromInfluxDB({ projectId, tpa, project }) {
    try {
        const influxClient = connectToInfluxDB(governify.infrastructure.getServiceURL("internal.database.influx-reporter"));

        const agreementId = `tpa-${projectId}`;

        const result = [];

        for(let guarantee of tpa.terms.guarantees) {
            const resultObject = { type: null, guarantee: guarantee, result: [] };
            if(guarantee.scope.member){
                resultObject.type = 'member';
                for(let member of project.scope.members) {
                    const guaranteeResult = await influxClient.query(`
                        SELECT * FROM "metrics_values" 
                        WHERE "agreement" = '${agreementId}' 
                        AND "id" = '${guarantee.id}' 
                        AND "scope_member" = '${member.memberId}' 
                        ORDER BY time DESC 
                        LIMIT 1
                    `);
                    resultObject.result.push(...guaranteeResult)
                }
                result.push(resultObject);
            } else {
                resultObject.type = 'team';
                const guaranteeResult = await influxClient.query(`
                    SELECT * FROM "metrics_values" 
                    WHERE "agreement" = '${agreementId}' 
                    AND "id" = '${guarantee.id}' 
                    ORDER BY time DESC 
                    LIMIT 1
                `);
                resultObject.result.push(...guaranteeResult)
                result.push(resultObject);
            }
        }

        log("Resultado de InfluxDB:");
        log(result)
        return result;
    } catch (error) {
        console.error("Error consultando InfluxDB:", error);
        throw error;
    } finally {
        globalInfluxClient = null;
    }
}

function formatResultForEmail(lastestGuaranteeResultsFromInflux, project) {
    let tpaResult = `## Compliance Report\n`;
    tpaResult += `The following report summarizes the compliance results for the practices proposed by the team ${project.scope?.identities[0]?.repository}. ${lastestGuaranteeResultsFromInflux.length} practices have been evaluated, and their results will be shared below:\n\n`;
    lastestGuaranteeResultsFromInflux.forEach(guaranteeResult => {
        if(guaranteeResult.type === 'member') {
            guaranteeResult.guarantee.notes = guaranteeResult.guarantee.notes.replace(/#### Description\r\n```\r\n/, '');
            tpaResult += `### ${guaranteeResult.guarantee.notes}\n${guaranteeResult.guarantee.description}\n`;
            guaranteeResult.result.forEach(result => {
                tpaResult += `- ${result.scope_member}: ${result.guaranteeValue} (${formatDateCustom(result.time)})\n`;
            });
        } else if(guaranteeResult.type === 'team') {
            guaranteeResult.guarantee.notes = guaranteeResult.guarantee.notes.replace(/#### Description\r\n```[\s\S]*?```\r\n/, '');
            tpaResult += `### ${guaranteeResult.guarantee.notes}\n${guaranteeResult.guarantee.description}\n`;
            guaranteeResult.result.forEach(result => {
                tpaResult += `- Team: ${result.guaranteeValue} (${formatDateCustom(result.time)})\n`;
            });
        }
    });
    return tpaResult
}

function formatDateCustom(dateString) {
    const date = new Date(dateString);
    const pad = n => n.toString().padStart(2, '0');
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const dd = pad(date.getDate());
    const MM = pad(date.getMonth() + 1);
    const yyyy = date.getFullYear();
    return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

async function sendTpaComplianceEmail({notificatorUrl, emails, tpaResultInMD}) {
    try {
        await axios.post(`${notificatorUrl}/api/v1/notify/email`, {
            to: emails,
            subject: "ISII: Compliance Result",
            text: tpaResultInMD,
            html: tpaResultInMD,
            isMarkdown: true
        });
        
        log(`Email sent to ${emails} with TPA result`);
    } catch (error) {
        log(error)
    }
    
}