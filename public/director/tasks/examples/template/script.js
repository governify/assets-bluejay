module.exports.main = (config) => {
	let result={date: new Date(), log:[]}; log=(data)=>result.log.push(data);
    try {
    //SCRIPT BEGIN
        //your code here
    //SCRIPT END
    } catch (error) {
        return { error: error.stack.split('\n').slice(0,3), log: result.log };
    }
	return result;
}