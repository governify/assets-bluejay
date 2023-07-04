module.exports.main = (config) => {
	let result={date: new Date(), results:[]}
	//Your code here
	for (let index = 0; index < config.repeat; index++) {
        result.results.push(config.name)
    }
	return result;
}