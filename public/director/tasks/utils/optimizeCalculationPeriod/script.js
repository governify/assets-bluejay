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
    //Config variables
    const batchSize = config.batchSize
    const startingTimeZstring = config.startingTime
    const endingTimeZstring = config.endingTime
    const filenameMustIncludeAll = config.filenameMustIncludeAll;
    //validation
    //filenameMustInclude must be a string array
    if(!Array.isArray(filenameMustIncludeAll) || filenameMustIncludeAll.length < 1) throw new Error("filenameMustInclude must be a string array")
    //startingTime and endingTime must be strings
    if(typeof startingTimeZstring != "string" || typeof endingTimeZstring != "string") throw new Error("startingTime and endingTime must be strings")

    //startingTime must be valid time
    if(!moment(startingTimeZstring, 'HH:mm', true).isValid()) throw new Error("startingTime is not a valid time in 24h format (HH:mm)")
    //endingTime must be valid time
    if(!moment(endingTimeZstring, 'HH:mm', true).isValid()) throw new Error("endingTime is not a valid time in 24h format (HH:mm)")

    if(typeof batchSize != "number" ) throw new Error("BatchSize must be number")
    if(batchSize<1 || 20<  batchSize) throw new Error("BatchSize out of bounds [0,20]")
    //end of validation
    
    
    const startingTime = moment(startingTimeZstring, 'HH:mm');
    const endingTime = moment(endingTimeZstring, 'HH:mm');

    const currentDirectory = path.join(process.cwd(), 'tasks');
    log(`Current directory: ${currentDirectory}`);
    log(`Searching for JSON files containing: ${filenameMustIncludeAll}`);

    const jsonFilesNames = fs.readdirSync(currentDirectory)
    .filter(fileName => fileName.endsWith('.json')) // Filter files by course and .json extension
    .filter(fileName => filenameMustIncludeAll.every(mustHaveString => fileName.includes(mustHaveString)))
    .filter(fileName => { // This is not the most efficient way. But its a way. Future should load the files only once
      try {
        const content = fs.readFileSync(path.join(currentDirectory, fileName), 'utf8');
        const data = JSON.parse(content);
        return data.running === true;
      } catch (error) {
        log(`Error reading or parsing file ${fileName}: ${error.message}`);
        return false;
      }
    })
    .map(fileName => path.parse(fileName).name); // Get file names without the extension

    if(jsonFilesNames.length < 1){
      throwError("Automatic computations not found in course containing "+ filenameMustIncludeAll)
    }
    log("Active computations: ")
    log(jsonFilesNames)

    if(batchSize > jsonFilesNames.length) throwError(`batch number too big (${batchSize}) for ${jsonFilesNames.length} groups`)
    const numberOfBatchs =  Math.ceil(jsonFilesNames.length / batchSize) //number of divisions of the time given
    if(numberOfBatchs <1 ) {log("All done, nothing changed");return result}
    const numberOfBatchsNormalized = numberOfBatchs-1 // with x batchs, you have x-1 time intervals between them
    const timeBetweenRuns = (endingTime.diff(startingTime) / numberOfBatchsNormalized) ;// e.g. 60min/(4-1) = 20 => i*20 => [00:00, 00:20, 00:40, 00:60]
    log(`${jsonFilesNames.length} files in groups of ${batchSize} = ${numberOfBatchs} ,minutesBetweenRuns: ${timeBetweenRuns/60000} minutes`)
    
    jsonFilesNames.forEach((file, index) => {
      const fullFilePath = path.join(currentDirectory, file+".json");

      const content = fs.readFileSync(fullFilePath, 'utf8') 



      const data = JSON.parse(content);

      const initDate = moment.utc(data.init, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
      const endDate = moment.utc(data.end, 'YYYY-MM-DDTHH:mm:ss.SSSZ');


      /*
      why the %(mod) operation? Lets say you have 5 computations problems(index) to do
      in 2 defined Times. You assing computations C0->T0 C1->T1 !!start again in Time 0!! C2-T0, C3->T1, C4->T0... the index can have big values, 
      mod operation resets them to always keep them in the batchs range
      the first one is the same, the second one is 20 minutes later, the third one is 40 minutes later, the fourth one is 60 minutes later
      */
      const adjustedInit = initDate
      .set({hour: startingTime.hours(), minute: startingTime.minutes(), second:0, milisecond:0}) 
      .add((index%numberOfBatchs) * timeBetweenRuns , 'ms');//i*20 => [00:00, 00:20, 00:40, 01:00]
      const adjustedEnd = endDate //same hour and minute as the start
      .set({hour: adjustedInit.hours(), minute: adjustedInit.minutes()})
      

      data.init = adjustedInit.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      data.end = adjustedEnd.format('YYYY-MM-DDTHH:mm:ss.SSSZ');

      const updatedContent = JSON.stringify(data, null, 2);
      
      fs.writeFileSync(fullFilePath, updatedContent, 'utf8');
      log(`Updated file content:`);
      log(data);
      
    });

    log("script end")
    return result;
    //SCRIPT END

  } catch (error) {
    console.error(error);
    return { error: error.stack.split('\n').slice(0,10), log: result.log };
  }
};
