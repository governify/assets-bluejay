"use strict";
const governify = require('governify-commons');
const axios = require('axios');
const _ = require('lodash');

/** Config Schema:
 *  {
 *    agreementId: "agreementRegex",
 *    modify: {
 *        "lodash-like-expression": "newValue",
 *    }
 *  }
 */
module.exports.main = async (config) => {
    if (!config.agreementId) return "Missing agreementId parameter";
    const registryUrl = `${governify.infrastructure.getServiceURL("internal.registry")}/api/v6/agreements`;
    const assetsUrl = `${governify.infrastructure.getServiceURL("internal.assets")}/api/v1`;
    
    let tpaFiles = await axios.get(`${assetsUrl}/info/public/renders/tpa`).then(res => res.data?.files ?? []).catch(() => []);
    tpaFiles = tpaFiles.filter(f => /.*\.json/.test(f.name)).map(f => f.name);
    
    let tpas = await axios.get(`${registryUrl}`).then(res => res.data?.filter(t => new RegExp(config.agreementId).test(t.id)) ?? []).catch(() => []);
    let tpasIds = tpas.map(t => t.id);

    Object.entries(config.modify ?? {}).forEach(([key, value]) => {
        tpas = tpas.map(t => _.set(t, key, value));
    });

    let err = [];
    for (const [index, id] of tpasIds.entries()) {
        await axios.delete(`${registryUrl}/${id}`).then(() => {
            return axios.post(`${registryUrl}`, tpas[index]).catch(() => {});
        }).catch(() => {
            err.push(`Error modifying agreement ${id} on registry`);
        });

        if (err.length === 0) {
            for (const file of tpaFiles) {
                const assetTpa = await axios.get(`${assetsUrl}/public/renders/tpa/${file}`).then(res => res.data).catch(() => {});
                if (assetTpa?.id === id) {
                    await axios.put(`${assetsUrl}/public/renders/tpa/${file}`, tpas[index]).catch(() => err.push(`Error modifying agreement ${id} (file ${file}) on assets`));
                }
            }
        }
    }

    if (err.length > 0) return err.join("\n");
    else return "Agreement modified"
}