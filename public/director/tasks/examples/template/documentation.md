## Template 1

You can use this template to test tasks that will be executed in "director" container at /opt/app.



To execute a task you will need:
- js file
- json file

Tasks can be stored in the assets repo at "public/director/tasks" and loaded with the dropdown above.
Also you can load a js from your computer. (configuration.json is not supported currently, write it manually in the editor)
### script.js
It is recomended to use this template, note that to succesfully test the script theese are mandatory requirements:
- Must use module.exports.main(config)
- main must return an object

Both are covered in the template so you can and insert your code between "SCRIPT BEGIN" and "SCRIPT END":
```js
module.exports.main = (config) => {
	let result={date: new Date(), log:[]}; log=(data)=>result.log.push(data);
    try {
    //SCRIPT BEGIN
        //your code here
    //SCRIPT END
    } catch (error) {
        return {error:error.message, log:result.log}
    }
	return result;
}
```
WARNING: console.log does not work in the ui. you can use the log() function instead

### configuration.json
Normaly a configuration.json file is needed (you can write it manually):
```json
{
    "name": "name of the script",
    "variable1": "value (string, int, object...)"
}
```
Please use readable names

