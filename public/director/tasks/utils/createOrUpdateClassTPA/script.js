"use strict";
const governify = require('governify-commons');
const axios = require('axios');

/** Config Schema:
 *  {
 *    template: "template name or url",
 *    mode: "create|replace"
 *    agreementId: "agreementId|agreementRegex",
 *    classId: "classId (create only)",
 *  }
 */
module.exports.main = async (config) => {

    // Checkers
    if (!config.template) return "Missing template parameter";
    if (!config.agreementId) return "Missing agreementId parameter";
    if (!config.mode) return "Missing mode parameter";
    if (config.mode === "create" && !config.classId) return "Missing classId parameter for create mode";

    const assetsUrl = `${governify.infrastructure.getServiceURL("internal.assets")}/api/v1/public/renders/tpa/`;
    const registryUrl = `${governify.infrastructure.getServiceURL("internal.registry")}/api/v6/agreements`;
    const templateUrl = (config.template.startsWith("http") ? "" : assetsUrl) + (config.template.includes(".json") ? config.template : `${config.template}.json`);

    const template = await axios.get(templateUrl).then(res => res.data).catch(() => {});
    if (!template) return "Error getting template file";


    if (config.mode === "create") {
        const tpa = JSON.stringify(template).replace(/1010101010/g, config.agreementId).replace(/2020202020/g, config.classId);
        return await axios.post(`${registryUrl}`, JSON.parse(tpa)).then(() => "Agreement created").catch(() => "Error creating agreement");
    } else if (config.mode === "replace") {
        const tpas = await axios.get(`${registryUrl}`).then(res => res.data?.filter(t => new RegExp(config.agreementId).test(t.id)) ?? []).catch(() => []);
        const errors = [];

        for (const tpa of tpas) {
            await axios.delete(`${registryUrl}/${tpa.id}`).then(() => {
                const tpaId = tpa.id.replace("tpa-", "");
                const classId = tpa.context.definitions.scopes.development.class.default;
                const newTpa = JSON.parse(JSON.stringify(template).replace(/1010101010/g, tpaId).replace(/2020202020/g, classId));
                return axios.post(`${registryUrl}`, newTpa).catch(() => errors.push(`Error on creation while replacing agreement ${tpa.id}`));
            }).catch(() => errors.push(`Error on deletion while replacing agreement ${tpa.id}`));            
        }

        if (errors.length > 0) return "ERRORS:\n" + errors.join("\n");
        else return "Agreements replaced";

    } else {
        return "Invalid mode parameter (create|replace)";
    }
}