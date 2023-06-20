const governify = require('governify-commons');
const fs = require('fs');
const StreamZip = require('node-stream-zip');
const { execSync } = require("child_process");
const Influx = require('influx');

const logger = governify.getLogger().tag('DB-Restore');

const DIR = `./tmp`;

async function getFile(config){
    const url = '$_[infrastructure.internal.assets.default]';
    const path = '/api/v1/public/database/backups/'+config.dbName+'/'+config.backup;

    const writer = fs.createWriteStream(DIR+"/"+config.backup);

    const response = await governify.httpClient({
        url: url+path,
        method: 'GET',
        responseType: 'stream',
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    })
}

async function unzipFiles(config){
    const zip = new StreamZip.async({ file: DIR+"/"+config.backup });

    const count = await zip.extract(null, DIR);
    logger.info(`Extracted ${count} entries`)
    fs.unlinkSync(DIR+"/"+config.backup)
}

async function makeRestoreInflux(config){
    const hostInflux = config.dbUrl.replace('http://','').split(':')
    console.log(hostInflux)
    const connection = new Influx.InfluxDB({
        host: hostInflux[0],
        port: hostInflux[1],
    }) 
    var dbs = []
    await connection.getDatabaseNames().then(names => {
        dbs = names
    });

    for (const db of dbs) {
        await connection.dropDatabase(db)
    }
    
    execSync(`influxd restore -portable -host ${hostInflux[0]}:8088 ${DIR}`)
}

module.exports.main = async function(config) {

    if (!fs.existsSync(DIR)){
        fs.mkdirSync(DIR);
    }

    try{
        await getFile(config);
        logger.info('Backup obtained from assets');
    
        await unzipFiles(config);

        switch (config.dbType) {
            case 'Mongo':
                execSync(`mongorestore --drop --uri="${config.dbUrl}" ${DIR}`);
                break;

            case 'Influx':
                await makeRestoreInflux(config)
                break;

            default:
                break;
        }
        
    }catch(err){

        logger.error('Error restoring DB: ' + err)
        fs.rmdirSync(DIR, { recursive: true });
        logger.info('Temporal files cleared')
        return
    }

    fs.rmdirSync(DIR, { recursive: true });
    logger.info('Temporal files cleared')
    return ''
}