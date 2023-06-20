const fs = require('fs');
const archiver = require('archiver');
const FormData = require('form-data');
const governify = require('governify-commons');
const { execSync } = require("child_process");

const logger = governify.getLogger().tag('DB-Backups');

const date = new Date();
const dateString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
const DIR = `./${dateString}`;

function zipDirectory(source, out) {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(out);
  
    return new Promise((resolve, reject) => {
      archive
        .directory(source, false)
        .on('error', err => reject(err))
        .pipe(stream);
  
      stream.on('close', () => resolve());
      archive.finalize();
    });
  }
  
async function sendFile(file,config){

    var form = new FormData();
    form.append('file', fs.createReadStream(file),file);

    await governify.httpClient.post('$_[infrastructure.internal.assets.default]'+'/api/v1/public/database/backups/'+config.dbName+"?createDirectories=true",form,{
        headers: {
            ...form.getHeaders()    
        },
        maxBodyLength: Infinity
    }).then(()=>{

        logger.info('File send to Assets');

        fs.unlinkSync(file)

        logger.info('Done')
    }).catch((err)=>{
        fs.unlinkSync(file)
        logger.error(err)
    })
    
}

function getCommand({dbType , dbUrl}){
    switch (dbType) {
        case 'Mongo':
            return `mongodump --uri="${dbUrl}" --out="${DIR}"`
            
        case 'Influx':
            var url = dbUrl.replace('http://','').split(':')
            return `influxd backup -portable -host ${url[0]}:8088 ${DIR}`
        
        default:
            break;
    }
}

function makeBackup(config){
    const command = getCommand(config)
    console.log(command)
    
    execSync(command);
}

module.exports.main = async function(config) {

    if (!fs.existsSync(DIR)){
        fs.mkdirSync(DIR);
    }

    try {
        makeBackup(config)

        await zipDirectory(DIR,`${dateString}_${config.dbName}.zip`)

        await sendFile(`${dateString}_${config.dbName}.zip`,config)

    } catch (error) {
        logger.error("Error saving db: ")
        fs.rmdirSync(DIR, { recursive: true });
        return
    }

    
    logger.info('Temporal files cleared')
    fs.rmdirSync(DIR, { recursive: true });

    return ''
}