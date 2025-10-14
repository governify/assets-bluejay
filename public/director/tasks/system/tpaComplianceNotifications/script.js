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
            const formatedResult = formatResultForEmail(lastestGuaranteeResultsFromInflux);
            const emails = project.scope.notifications.email.split(',').map(email => email.trim());
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
            const resultObject = { scope: null, window: null, guarantee: guarantee, result: [] };
            resultObject.window = guarantee.of[0].window.period;
            if(guarantee.scope.member){
                resultObject.scope = 'member';
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
                resultObject.scope = 'team';
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

function formatResultForEmail(lastestGuaranteeResultsFromInflux) {
    let tpaResult = `## Team Practices Report\n`;
    tpaResult += `The following report summarizes the compliance results for the proposed team practices. ${lastestGuaranteeResultsFromInflux.length} practices have been evaluated, and their current results are presented below.\n\n`;

    tpaResult += `---\n`;

    tpaResult += `## Hourly Practices\n`;
    tpaResult += `Data collected from ${formatDate(new Date(new Date((lastestGuaranteeResultsFromInflux.filter(r => r.window === 'hourly'))[0].result[0].time).getTime() - 60*60*1000))} to ${formatDate((lastestGuaranteeResultsFromInflux.filter(r => r.window === 'hourly'))[0].result[0].time)}.\n`;
    tpaResult += `### Team Practices`;
    tpaResult += formatGuaranteeResults(lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'team' && r.window === 'hourly'));
    tpaResult += `\n### Member Practices`;
    tpaResult += formatGuaranteeResults(lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'member' && r.window === 'hourly'));

    tpaResult += `\n---\n`;

    tpaResult += `## Weekly Practices\n`;
    tpaResult += `Data collected from ${formatDate(new Date(new Date((lastestGuaranteeResultsFromInflux.filter(r => r.window === 'weekly'))[0].result[0].time).getTime() - 7*24*60*60*1000))} to ${formatDate((lastestGuaranteeResultsFromInflux.filter(r => r.window === 'weekly'))[0].result[0].time)}.\n`;
    tpaResult += `### Team Practices`;
    tpaResult += formatGuaranteeResults(lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'team' && r.window === 'weekly'));
    tpaResult += `\n### Member Practices`;
    tpaResult += formatGuaranteeResults(lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'member' && r.window === 'weekly'));

    tpaResult += `\n---\n`;

    tpaResult += `## Guidelines for interpreting the results:\n`;
    tpaResult += `- Each Team Practice (TP) is assigned to a specific scope, which can apply either to individual members or to the entire team.\n`;
    tpaResult += `- Two time windows are considered: hourly and weekly. Hourly practices show results for the past hour, while weekly practices show results for the past 7 days.\n`;
    tpaResult += `- Each TP has an objective value that must be met to be considered compliant (✅). If the result does not meet this value, it is considered non-compliant (❌). Some practices are based on the correlation between two metrics. In these cases, if both required metrics have a value of 0, the result will be marked as N/A (⚠️), since there is no data to establish a correlation.\n\n`;

    tpaResult += `\n*This is an automated message, please do not reply to this email. For any questions, please contact the project supervisor.*\n`;
    return tpaResult
}

function formatGuaranteeResults(guaranteeResults) {
    let tpaResult = ``;

    guaranteeResults.forEach(guaranteeResult => {
        const withKeys = Object.keys(guaranteeResult.guarantee.of[0].with || {});
        let key1, key2;
        if(guaranteeResult.guarantee.id.includes('CORRELATION')) {
            key1 = withKeys[0];
            key2 = withKeys[1];
        }
        const objective = guaranteeResult.guarantee.of[0].objective; 
        const match = objective.match(/(>=|<=|=|<|>)\s*(\d+)/);
        const operator = match[1]; // '>=', '<=', '=', '<', '>'
        const objectiveValue = parseInt(match[2], 10);

        guaranteeResult.guarantee.notes = guaranteeResult.guarantee.notes.replace(/#### Description\r\n```\r\n/, '');
        tpaResult += `\n**${guaranteeResult.guarantee.notes}**  \n`;
        tpaResult += `${guaranteeResult.guarantee.description}  \n`;

        tpaResult += `- **Objective:** result ${operator} ${objectiveValue}  \n`;
        if(guaranteeResult.scope === 'member') {
            guaranteeResult.result.forEach(result => {
                let statusIcon = getStatusIcon(result.guaranteeValue, operator, objectiveValue);
                if(guaranteeResult.guarantee.id.includes('CORRELATION')) {
                    if(result[`metric_${key1}`] === 0 && result[`metric_${key2}`] === 0) {
                        tpaResult += `- ${result.scope_member}: N/A (⚠️)\n`;
                    } else {
                        tpaResult += `- ${result.scope_member}: ${result.guaranteeValue.toFixed(2)}% (${statusIcon})\n`;
                    }
                } else {
                    tpaResult += `- ${result.scope_member}: ${result.guaranteeValue} (${statusIcon})\n`;
                }
            });
        } else if(guaranteeResult.scope === 'team') {
            guaranteeResult.result.forEach(result => {
                const statusIcon = getStatusIcon(result.guaranteeValue, operator, objectiveValue);
                if(guaranteeResult.guarantee.id.includes('CORRELATION')) {
                    if(result[`metric_${key1}`] === 0 && result[`metric_${key2}`] === 0) {
                        tpaResult += `- Team: N/A (⚠️)\n`;
                    } else {
                        tpaResult += `- Team: ${result.guaranteeValue.toFixed(2)}% (${statusIcon})\n`;
                    }
                } else {
                    tpaResult += `- Team: ${result.guaranteeValue} (${statusIcon})\n\n`;
                }
            });
        }
    });

    return tpaResult;
}

function formatDate(date) {
    const d = new Date(date);
    const pad = n => n.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function getStatusIcon(resultValue, operator, objectiveValue) {
    if (operator === '>=' && resultValue >= objectiveValue) {
        return '✅';
    } else if (operator === '<=' && resultValue <= objectiveValue) {
        return '✅';
    } else if (operator === '=' && resultValue === objectiveValue) {
        return '✅';
    } else if (operator === '<' && resultValue < objectiveValue) {
        return '✅';
    } else if (operator === '>' && resultValue > objectiveValue) {
        return '✅';
    } else {
        return '❌';
    }
}

async function sendTpaComplianceEmail({notificatorUrl, emails, tpaResultInMD}) {
    try {
        await axios.post(`${notificatorUrl}/api/v1/notify/email`, {
            to: emails,
            subject: "ISII: Team Practices Report",
            text: tpaResultInMD,
            html: tpaResultInMD,
            isMarkdown: true
        });
        
        log(`Email sent to ${emails} with TPA result`);
    } catch (error) {
        log(error)
    }
    
}