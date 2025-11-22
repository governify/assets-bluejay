const axios = require('axios');
const { InfluxDB } = require('influx');
const governify = require('governify-commons');
let globalInfluxClient = null;

module.exports.main = async (config) => {
    let result = { date: new Date(), log: [] }; log = (data) => {result.log.push(data); console.log(data); };
    try {
        //SCRIPT BEGIN
        const notificatorUrl = governify.infrastructure.getServiceURL("internal.notificator");
        let emails = [];
        let emailTextInMarkdown = '';
        if (config.forAdmin) { // summary of all groups for admins
            log('Processing admin data');
            emails = config.adminEmails.split(',').map(email => email.trim());
            const courseData = await axios.get(`${governify.infrastructure.getServiceURL("internal.scopes")}/api/v1/scopes/development/${config.courseId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': config.scopeManagerKey
                    }
                });
            const course = courseData.data;
            emailTextInMarkdown = `<h1>Team Practices Report for Course: ${course.scope.classId}</h1>`;
            let projects = course.scope.projects;
            for (let project of projects) {
                const tpaData = await axios.get(`${governify.infrastructure.getServiceURL("internal.registry")}/api/v6/agreements/tpa-${project.projectId}`);
                const tpa = tpaData.data;
                const partialEmailText = await getEmailForProject({ tpa, project, projectId: project.projectId });
                emailTextInMarkdown += `<hr/><h2>Project: ${project.name}</h2>`;
                const githubIdentity = project.identities.find(identity => identity.source === 'github');
                if (githubIdentity) {
                    const { repoOwner, repository } = githubIdentity;
                    const url = `https://github.com/${repoOwner}/${repository}`;
                    emailTextInMarkdown += `<p><a href="${url}">Github Repository</a></p>`;
                }
                const dashboardUrl = `${governify.infrastructure.getServiceURL("external.dashboard")}/dashboard/script/dashboardLoader.js?dashboardURL=${governify.infrastructure.getServiceURL("external.reporter")}/api/v4/dashboards/tpa-${project.projectId}/main`;
                emailTextInMarkdown += `<p><a href="${dashboardUrl}">Dashboard URL</a></p>`;
                emailTextInMarkdown += `<div>${partialEmailText}</div>`;
            }

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
            const project = projectData.data.scope;
            log('Project data retrieved');
            emailTextInMarkdown = await getEmailForProject({ tpa, project, projectId: config.projectId });
            log('Notificator url: ' + notificatorUrl);
            emails = project.notifications.email.split(',').map(email => email.trim());
        }
        await sendTpaComplianceEmail({ notificatorUrl, emails: emails, tpaResultInMD: emailTextInMarkdown });
        //SCRIPT END
    } catch (error) {
        console.error(error);
        return { error: error.stack.split('\n').slice(0, 3), log: result.log };
    }
    return result;
}

async function getEmailForProject({ tpa, project, projectId, forAdmin }) {
    const lastestGuaranteeResultsFromInflux = await getTpaResultFromInfluxDB({ projectId, tpa, project });
    const formatedResult = formatResultForEmail(lastestGuaranteeResultsFromInflux);
    return formatedResult;
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
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startTime = sevenDaysAgo.toISOString();
        const endTime = now.toISOString();

        for (let guarantee of tpa.terms.guarantees) {
            const resultObject = { scope: null, window: null, guarantee: guarantee, result: [] };
            resultObject.window = guarantee.of[0].window.period;
            // Fetch all recent points (last week for hourly, last 30 days for weekly)
            let filterAndTime = '';
            if (guarantee.of[0].window.period === 'hourly') {
                filterAndTime = `AND time >= '${startTime}' AND time <= '${endTime}' ORDER BY time DESC`;
            } else {
                filterAndTime = 'ORDER BY time DESC LIMIT 1';
            }

            if (guarantee.scope.member) {
                resultObject.scope = 'member';
                for (let member of project.members) {
                    const guaranteeResult = await influxClient.query(`
                        SELECT * FROM "metrics_values" 
                        WHERE "agreement" = '${agreementId}' 
                        AND "id" = '${guarantee.id}' 
                        AND "scope_member" = '${member.memberId}' 
                        ${filterAndTime}
                    `);
                    // Always push as array for formatting
                    resultObject.result.push(...guaranteeResult);
                }
                result.push(resultObject);
            } else {
                resultObject.scope = 'team';
                const guaranteeResult = await influxClient.query(`
                    SELECT * FROM "metrics_values" 
                    WHERE "agreement" = '${agreementId}' 
                    AND "id" = '${guarantee.id}' 
                    ${filterAndTime}
                `);
                // Always push as array for formatting
                resultObject.result.push(...guaranteeResult);
                result.push(resultObject);
            }
        }

        log("Result from InfluxDB obtained");
        return result;
    } catch (error) {
        log("Error with InfluxDB:", error);
        console.log(error);
        throw error;
    } finally {
        globalInfluxClient = null;
    }
}

function formatResultForEmail(lastestGuaranteeResultsFromInflux) {
    let tpaResult = `<h1>Team Practices Report</h1>`;
    tpaResult += `<p>The following report summarizes the compliance results for the proposed team practices. ${lastestGuaranteeResultsFromInflux.length} practices have been evaluated, and their current results are presented below.</p>`;
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    tpaResult += `<p>Data collected from ${formatDate(weekAgo)} to ${formatDate(now)}.</p>`;
    tpaResult += `<hr/>`;
    const hourlyTeamResults = lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'team' && r.window === 'hourly');
    const hourlyMemberResults = lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'member' && r.window === 'hourly');

    if (hourlyTeamResults.length > 0 || hourlyMemberResults.length > 0) {
        tpaResult += `<h2>Hourly Practices</h2>`;
    }
    if (hourlyTeamResults.length > 0) {
        tpaResult += `<h3>Team Practices</h3>`;
        tpaResult += formatGuaranteeResults(hourlyTeamResults);
    }
    if (hourlyMemberResults.length > 0) {
        tpaResult += `<h3>Member Practices</h3>`;
        tpaResult += formatGuaranteeResults(hourlyMemberResults);
    }
    if (hourlyTeamResults.length > 0 || hourlyMemberResults.length > 0) {
        tpaResult += `<hr/>`;
    }

    const weeklyTeamResults = lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'team' && r.window === 'weekly');
    const weeklyMemberResults = lastestGuaranteeResultsFromInflux.filter(r => r.scope === 'member' && r.window === 'weekly');

    if (weeklyTeamResults.length > 0 || weeklyMemberResults.length > 0) {
        tpaResult += `<h2>Weekly Practices</h2>`;
    }
    if (weeklyTeamResults.length > 0) {
        tpaResult += `<h3>Team Practices</h3>`;
        tpaResult += formatGuaranteeResults(weeklyTeamResults);
    }
    if (weeklyMemberResults.length > 0) {
        tpaResult += `<h3>Member Practices</h3>`;
        tpaResult += formatGuaranteeResults(weeklyMemberResults);
    }
    if (weeklyTeamResults.length > 0 || weeklyMemberResults.length > 0) {
        tpaResult += `<hr/>`;
    }

        tpaResult += `
        <h2>Guidelines for interpreting the results:</h2>
        <ul>
            <li><b>What is a Team Practice (TP)?</b><br/>
                A Team Practice (TP) is a rule with an objective that your team or its members should follow. Each TP can apply to the whole team or to individual members, depending on its scope.
            </li>
            <li><b>What does the time window mean?</b><br/>
                There are two types of time windows: hourly and weekly. However, <b>all compliance percentages are always calculated using all the data collected from the last 7 days</b>, regardless of whether the practice is labeled as hourly or weekly. This means that even if a practice is checked every hour, the compliance percentage shown is based on the last 7 days of data.
            </li>
            <li><b>What does the compliance percentage mean and how is it calculated?</b><br/>
                <ul>
                    <li><b>For numeric practices</b> (where the result is either compliant or not): Every data point from the last 7 days is checked to see if it meets the objective. The compliance percentage is the number of compliant data points divided by the total number of data points, shown as a percentage.<br/>
                        <b>Example:</b> If there are 10 data points in the last week and 7 meet the objective, the compliance percentage is 70% (7 out of 10).
                    </li>
                    <li><b>For percentage or correlation practices</b> (where the result is a percentage or correlation value): The compliance percentage is simply the average of all non-null values from the last 7 days. There is no division by the number of compliant points; instead, all available values are averaged.<br/>
                        <b>Example:</b> If the last week has 5 values: 80%, 90%, 100%, 70%, and 60%, the compliance percentage is (80+90+100+70+60)/5 = 80%.
                    </li>
                </ul>
            </li>
        </ul>
        <p><em>This is an automated message. Please do not reply to this email. For any questions, please contact the project supervisor.</em></p>
        `;
    return tpaResult;
}

function formatGuaranteeResults(guaranteeResults) {
    let tpaResult = ``;

    guaranteeResults.forEach(guaranteeResult => {
        const withKeys = Object.keys(guaranteeResult.guarantee.of[0].with || {});
        let key1, key2;
        if (guaranteeResult.guarantee.id.includes('CORRELATION')) {
            key1 = withKeys[0];
            key2 = withKeys[1];
        }
        const objective = guaranteeResult.guarantee.of[0].objective;
        const match = objective.match(/(>=|<=|=|<|>)\s*(\d+)/);
        const operator = match[1];
        const objectiveValue = parseInt(match[2], 10);

        // Sanitize notes and description to avoid breaking Markdown/HTML
        let safeNotes = (guaranteeResult.guarantee.notes || '').replace(/#### Description\r\n```\r\n/, '').replace(/["'`<>]/g, '');
        let safeDescription = (guaranteeResult.guarantee.description || '').replace(/["'`<>]/g, '');
        tpaResult += `\n<strong>${safeNotes}</strong><br/>`;
        tpaResult += `\n${safeDescription}<br/>`;
        tpaResult += `\n<em>Objective: result ${operator} ${objectiveValue}</em><br/>`;

        // Always treat result as array
        let resultsArr = Array.isArray(guaranteeResult.result) ? guaranteeResult.result : [guaranteeResult.result];
        // Helper to split date and hour
        function splitDateTime(dt) {
            const d = new Date(dt);
            const date = d.toLocaleDateString('en-GB');
            const hour = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            return { date, hour };
        }

        function htmlTableTransposed(resultsArr, isCorrelation, key1, key2, operator, objectiveValue, guaranteeId) {
            // Each row is a property, each column is a data point
            const dateRow = ['<th style="border:1px solid #888;padding:4px 8px;text-align:left;">Date</th>'];
            const valueRow = ['<th style="border:1px solid #888;padding:4px 8px;text-align:left;">Value</th>'];
            const complianceRow = ['<th style="border:1px solid #888;padding:4px 8px;text-align:left;">Compliance</th>'];
            // For compliance percentage
            let positive = 0, negative = 0;
            let valueSum = 0, valueCount = 0;
            const isSpecial = /CORRELATION|PERCENTAGE/i.test(guaranteeId);
            resultsArr.forEach(result => {
                let { date, hour } = splitDateTime(result.time);
                // Date cell: plain text, two lines
                dateRow.push(`<td style="border:1px solid #888;padding:4px 8px;text-align:center;vertical-align:middle;">${date}<br/>${hour}</td>`);
                // Value cell
                if (isCorrelation && result[`metric_${key1}`] === 0 && result[`metric_${key2}`] === 0) {
                    valueRow.push(`<td style="border:1px solid #888;padding:4px 8px;text-align:center;vertical-align:middle;">N/A</td>`);
                    complianceRow.push(`<td style="border:1px solid #888;padding:4px 8px;text-align:center;vertical-align:middle;">⚠️</td>`);
                } else {
                    let value = isCorrelation ? result.guaranteeValue : result.guaranteeValue;
                    let valueDisplay = isCorrelation ? `${result.guaranteeValue.toFixed(2)}%` : result.guaranteeValue;
                    valueRow.push(`<td style="border:1px solid #888;padding:4px 8px;text-align:center;vertical-align:middle;">${valueDisplay}</td>`);
                    let statusIcon = getStatusIcon(result.guaranteeValue, operator, objectiveValue);
                    complianceRow.push(`<td style="border:1px solid #888;padding:4px 8px;text-align:center;vertical-align:middle;">${statusIcon}</td>`);
                    if (isSpecial) {
                        if (typeof value === 'number' && !isNaN(value)) {
                            valueSum += value;
                            valueCount++;
                        }
                    } else {
                        if (statusIcon === '✅') positive++;
                        else if (statusIcon === '❌') negative++;
                    }
                }
            });
            let complianceHTML = '';
            // Dynamic color for compliance box
            function getBoxColor(p) {
                if (p === null || isNaN(p)) return '#f8f8e8';
                if (p < 50) return '#ffcccc'; // red
                if (p < 75) return '#fff8b0'; // yellow
                return '#c8f7c5'; // green
            }
            function getBoxBorder(p) {
                if (p === null || isNaN(p)) return '#e0e000';
                if (p < 50) return '#ff4444';
                if (p < 75) return '#e0e000';
                return '#2ecc40';
            }
            const boxBaseStyle = 'display:inline-block;margin-top:8px;padding:10px 16px;border-radius:8px;text-align:center;width:auto;white-space:nowrap;';
            if (isSpecial) {
                let avg = null;
                if (valueCount > 0) {
                    avg = Number((valueSum / valueCount).toFixed(2));
                    const color = getBoxColor(avg);
                    const border = getBoxBorder(avg);
                    complianceHTML = `<div style="${boxBaseStyle}background:${color};border:2px solid ${border};"><b>Compliance percentage (average): ${avg}%</b></div><div style=\"height:18px;\"></div>`;
                } else {
                    complianceHTML = `<div style="${boxBaseStyle}background:#f8f8e8;border:2px solid #e0e000;"><b>Compliance percentage (average): N/A (no data)</b></div><div style=\"height:18px;\"></div>`;
                }
            } else {
                const total = positive + negative;
                if (total > 0) {
                    const percent = Number(((positive / total) * 100).toFixed(1));
                    const color = getBoxColor(percent);
                    const border = getBoxBorder(percent);
                    complianceHTML = `<div style="${boxBaseStyle}background:${color};border:2px solid ${border};"><b>Compliance percentage: ${percent}% (${positive} of ${total})</b></div><div style=\"height:18px;\"></div>`;
                } else {
                    complianceHTML = `<div style="${boxBaseStyle}background:#f8f8e8;border:2px solid #e0e000;"><b>Compliance percentage: N/A (no data)</b></div><div style=\"height:18px;\"></div>`;
                }
            }
            return `${complianceHTML}`; // Table is hidden until further notice
            // return `<table style="border-collapse:collapse;margin:10px 0;min-width:600px;"><tbody>
            //     <tr>${dateRow.join('')}</tr>
            //     <tr>${valueRow.join('')}</tr>
            //     <tr>${complianceRow.join('')}</tr>
            // </tbody></table>${complianceHTML}`;
        }

        if (guaranteeResult.scope === 'member') {
            // Group by member
            const byMember = {};
            resultsArr.forEach(r => {
                if (!byMember[r.scope_member]) byMember[r.scope_member] = [];
                byMember[r.scope_member].push(r);
            });
            Object.entries(byMember).forEach(([member, memberResults]) => {
                tpaResult += `\n${member}<br/>\n`;
                tpaResult += htmlTableTransposed(
                    memberResults,
                    guaranteeResult.guarantee.id.includes('CORRELATION'),
                    key1,
                    key2,
                    operator,
                    objectiveValue,
                    guaranteeResult.guarantee.id
                );
            });
        } else if (guaranteeResult.scope === 'team') {
            tpaResult += `Team<br/>`;
            tpaResult += htmlTableTransposed(
                resultsArr,
                guaranteeResult.guarantee.id.includes('CORRELATION'),
                key1,
                key2,
                operator,
                objectiveValue,
                guaranteeResult.guarantee.id
            );
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

async function sendTpaComplianceEmail({ notificatorUrl, emails, tpaResultInMD }) {
    try {
        await axios.post(`${notificatorUrl}/api/v1/notify/email`, {
            to: emails,
            subject: "ISII: Team Practices Report",
            text: tpaResultInMD,
            html: tpaResultInMD,
            isMarkdown: false
        }, {
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        log(`Email sent to ${emails} with TPA result`);
        // console.log(`Content:\n${tpaResultInMD}`);
    } catch (error) {
        log(error)
    }

}