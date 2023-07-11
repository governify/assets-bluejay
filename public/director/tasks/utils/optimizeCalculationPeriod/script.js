"use strict";

const fs = require('fs');
const path = require('path');
const moment = require('moment');

module.exports.main = async (config) => {
  let result = { date: new Date(), log: [] };
  const log = (data) => {console.log(data);result.log.push(data)};
  const throwError = (message) => {result.log.push(message); throw new Error(result.log[result.log.length-1])}
  try {
    //SCRIPT BEGIN
    if(config.batchSize<1 || 20<  config.batchSize) throw new Error("BatchNumber out of bounds [0,20]")
    const currentDirectory = path.join(process.cwd(), 'tasks');
    log(`Current directory: ${currentDirectory}`);
    const courseName = config.courseRegex;
    log(`Searching for JSON files containing: ${courseName}`);

    const jsonFiles = fs.readdirSync(currentDirectory)
    .filter(file => file.includes('tpa-'+courseName) && file.endsWith('.json')) // Filter files by course and .json extension
    .map(file => path.parse(file).name); // Get file names without the extension

    if(jsonFiles.length < 1){
      throwError("Automatic computations not found in course "+ courseName)
      
    }
    log("Active computations: ")
    log(jsonFiles)
    if(config.batchSize > jsonFiles.length) throwError(`batch number too big (${config.batchSize}) for ${jsonFiles.length} groups`)
    const numberOfBatchs =  Math.ceil(jsonFiles.length / config.batchSize) //number of divisions of the time given
    if(numberOfBatchs <=1 ) {log("All done, nothing changed");return result}
    const numberOfBatchsNormalized = numberOfBatchs-1 // takes out the intial date (not modified) 60 min / (4-1) = 20 => i*20 => [00:00, 00:20, 00:40, 00:60]
    const timeBetweenRuns = config.maxMinutesDelay*60*1000 / numberOfBatchsNormalized ; 
    log(`${jsonFiles.length} files in groups of ${config.batchSize} = ${numberOfBatchs} ,timeBetweenRuns: ${timeBetweenRuns}`)
    jsonFiles.forEach((file, index) => {
      const fullFilePath = path.join(currentDirectory, file+".json");

      const content = fs.readFileSync(fullFilePath, 'utf8') 



      const data = JSON.parse(content);

      const initDate = moment.utc(data.init, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
      const endDate = moment.utc(data.end, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
      //why the %(mod) operation? Lets say you have 5 computations problems(index) to do
      //in 2 defined Times. You assing computations C0->T0 C1->T1 !!start again in Time 0!! C2-T0, C3->T1, C4->T0... the index can have big values, 
      //mod operation resets them to always keep them in the batchs range
      const adjustedInit = initDate.add((index%numberOfBatchs) * timeBetweenRuns, 'ms').format('YYYY-MM-DDTHH:mm:ss.SSSZ');//i*20 => [00:00, 00:20, 00:40, 00:60]
      const adjustedEnd = endDate.add((index%numberOfBatchs) * timeBetweenRuns, 'ms').format('YYYY-MM-DDTHH:mm:ss.SSSZ');

      data.init = adjustedInit;
      data.end = adjustedEnd;

      const updatedContent = JSON.stringify(data, null, 2);
      
      fs.writeFileSync(fullFilePath, updatedContent, 'utf8');
      log(`Updated file content:`);
      log(data);
      
    });

    log("script end")
    return result;
    //SCRIPT END

  } catch (error) {
    return { error: error.stack.split('\n').slice(0,3), log: result.log };
  }
};
