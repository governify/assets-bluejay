const fs = require('fs');
const FormData = require('form-data');
const governify = require('governify-commons');
const http = require('http')

const logger = governify.getLogger().tag('Scope-Backups');

const date = new Date();
const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
const DIR = `./${dateString}`;

async function sendFile(file, config) {

  var form = new FormData();
  form.append('file', fs.createReadStream(file), file);

  await governify.httpClient.post('$_[infrastructure.internal.assets.default]' + '/api/v1/public/database/backups/' + config.dbName + "?createDirectories=true", form, {
    headers: {
      ...form.getHeaders()
    },
    maxBodyLength: Infinity
  }).then(() => {

    logger.info('File send to Assets');

    fs.unlinkSync(file)

    logger.info('Done')
  }).catch((err) => {
    fs.unlinkSync(file)
    logger.error(err)
  })

}

async function getScopes() {
  const res = await governify.httpClient.get('$_[infrastructure.internal.assets.default]' + '/api/v1/private/scope-manager/scopes.json?private_key=' + process.env.KEY_ASSETS_MANAGER_PRIVATE)
  return res.data
}

async function makeBackup(config) {
  const file = await getScopes()
  fs.writeFileSync(`${DIR}/${config.dbName}-${dateString}.json`, JSON.stringify(file))
}

module.exports.main = async function (config) {

  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR);
  }

  try {
    await makeBackup(config)

    await sendFile(`${DIR}/${config.dbName}-${dateString}.json`, config)

  } catch (error) {

    logger.error("Error saving Scope: " + error)
  }
  fs.rmdirSync(DIR, { recursive: true });
  logger.error("Temporal files cleared")
  return ''
}