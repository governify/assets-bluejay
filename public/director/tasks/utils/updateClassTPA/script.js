const governify = require('governify-commons');
const axios = require('axios');

module.exports.main = async (config) => {
	let result={date: new Date(), log:[]}; log=(data)=>result.log.push(data);
    try {
    //SCRIPT BEGIN
        const courseId = config.courseId;
        const scopeManagerKey = config.scopeManagerKey;
        const templateId = config.templateId;
        const templateData = await axios.get(`${governify.infrastructure.getServiceURL("internal.registry")}/api/v6/templates/${templateId}`)
        if (!templateData) return "Error getting template file";
        const template = templateData.data;
        const templateString = JSON.stringify(template);
        const courseData = await axios.get(`${governify.infrastructure.getServiceURL("internal.scopes")}/api/v1/scopes/development/${courseId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': scopeManagerKey
                }
            });
        const course = courseData.data.scope;
        console.log(template)
        if (!course) return "Error getting course data";
        for(const project of course.projects) {
            const projectId = project.projectId;
            const tpaId = `tpa-${projectId}`;
            const tpa = JSON.parse(templateString
                  .replace(/1010101010/g, projectId)
                  .replace(/2020202020/g, courseId)
                  .replace(/\$_\[infrastructure\.internal\.assets\.default\]/g, governify.infrastructure.getServiceURL("internal.assets"))
                  .replace(/\$_\[infrastructure\.internal\.scopes\.default\]/g, governify.infrastructure.getServiceURL("internal.scopes")));
            tpa.type = 'agreement';
            delete tpa._id;
            delete tpa.id;
            updatedTpa = await axios.put(`${governify.infrastructure.getServiceURL("internal.registry")}/api/v6/agreements/${tpaId}`, tpa)
            log(`TPA for project ${projectId} updated`);
        }
    //SCRIPT END
    } catch (error) {
        return { error: error.stack.split('\n').slice(0,3), log: result.log };
    }
	return result;
}