$scope.displayMessage = false;
$scope.message = "";
$scope.responseCode = "";
$scope.scriptResponse = "{}";
const doc = "# TIPS \n- You can load scripts from the dropdown avobe. Try 'example' 1 or 'template' for documentation \n- Also it is possible to upload a script from your computer <br> warning: currently config upload is not suppoted, write it  manually";
const tasksPath = 'public/director/tasks';


$scope.form = {
    scriptText :  "//script",
    scriptConfig : "{}"
}
$scope.folders = []; //example: $scope.folders = [{label: 'Folder 1',options: ['script 1', 'script 2']},{label: 'Folder 2',options: ['script 3']}];
var scriptTextEditor = undefined;
var scriptConfigEditor = undefined;
var scriptResponseEditor = undefined;

var buildTestPayload = (scriptText,scriptConfig) => {
    let config = JSON.parse(scriptConfig)
    return { 
        "scriptText" : scriptText,
        "scriptConfig" : config
    }
}

jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
}

//CODE HIGHLIGHTING AND MARKDOWN
$.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/codemirror.min.js', function(){
    $.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/mode/javascript/javascript.min.js', function(){
        $.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/addon/lint/lint.min.js', function(){
            $.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/addon/lint/json-lint.min.js', function(){
                scriptConfigEditor = CodeMirror.fromTextArea(document.getElementById("scriptConfig"), {
                    mode: "application/json",
                    lineNumbers: true,
                    theme: "material",
                    lint: true
                });
                scriptResponseEditor = CodeMirror.fromTextArea(document.getElementById("scriptResponse"), {
                    mode: "application/json",
                    lineNumbers: true,
                    theme: "material",
                    readOnly: true,
                    lint: true
                });
            });
        });
        scriptTextEditor = CodeMirror.fromTextArea(document.getElementById("scriptText"), {
            mode: "javascript",
            lineNumbers: true,
            theme: "material"
        });
    });
});
$.getScript('https://cdn.jsdelivr.net/npm/marked@2.1.3/marked.min.js', function(){
    const html = marked(doc);
    $scope.documentation = html;
});



$scope.testScript = function() {
    $scope.displayMessage = true;
    $scope.form.scriptText = scriptTextEditor.getValue();
    $scope.form.scriptConfig = scriptConfigEditor.getValue();
    if ($scope.form.scriptText !== "" && $scope.form.scriptConfig !== "") {
        //Building payload
        try{
            var payload= buildTestPayload($scope.form.scriptText,$scope.form.scriptConfig);
        }catch(err){
            console.log(err);
            $scope.message = "badFields";
            $scope.taskTestResponse = "Bad JSON configuration";
            return;
        }
        
        // Test Task
        let url = "$_[infrastructure.external.director.default]/api/v1/tasks/test";
        
        $http.post(url,payload).then(response => {
            $scope.message = "ok";
            $scope.taskTestResponse = "Script successfully tested";
            $scope.responseCode = response.status.toString();
            $scope.scriptResponse = JSON.stringify(response.data,null,2);
            scriptResponseEditor.setValue(JSON.stringify(response.data,null,2));
        }).catch(err => {
            $scope.message = "error";
            $scope.taskTestResponse = "Script unsuccessfully tested";
            $scope.responseCode = 500;
            console.log(err);
        })
    }else{
        $scope.message = "badFields";
        $scope.taskTestResponse = "You must fill in all the fields";
    }
}


$scope.loadFile = function() {
    let f = document.getElementById('file').files[0];
    if(f.type.match('^text/plain') || f.type.match('^text/javascript')){
        let reader = new FileReader();
        reader.addEventListener('load', function (e) {
            let data = e.target.result;
            $scope.$apply(function(){$scope.form.scriptText = data;});
            scriptTextEditor.setValue(data);
            scriptResponseEditor.setValue("Waiting for results")
        });
        reader.readAsBinaryString(f);
    }
}


function getFolderNames(path) {
    return $http.get("$_[infrastructure.external.assets.default]/api/v1/info/" + path)
      .then(response => {
        const folderInfo = response.data;
        const folders = folderInfo.files.filter(file => file.dir).map(file => file.name);
        return folders;
      })
      .catch(err => {
        console.log(err);
        return [];
      });
  }
  
  function setSelectFolders(tasksPath) {
    getFolderNames(tasksPath)
      .then(taskTypes => {
        const selectFolders = [];
  
        taskTypes.forEach(taskType => {
          getFolderNames(tasksPath + '/' + taskType)
            .then(tasksNames => {
              const selectGroup = { label: taskType, options: tasksNames };
              selectFolders.push(selectGroup);
            })
            .finally(() => {
              $scope.folders = selectFolders;
            });
        });
      });
  }

// LOAD SCRIPTS FORM BLUEJAY ASSETS




$scope.loadAssetScript = function(selectedTaskFolder){
    //load script.js configuration.json documentation.md
    const newUrl = "$_[infrastructure.external.assets.default]/api/v1/" + tasksPath +"/"+ selectedTaskFolder

    scriptResponseEditor.setValue("")
    //JS
    $http.get(newUrl+"/script.js")
      .then(response => {
        scriptTextEditor.setValue(response.data);}).catch(err => scriptTextEditor.setValue(null))
    //JSON
        $http.get(newUrl+"/configuration.json")
    .then(response => {
    scriptConfigEditor.setValue(JSON.stringify(response.data,null,2));}).catch(err => scriptConfigEditor.setValue(null))
    //MD
    $http.get(newUrl+"/documentation.md")
    .then(response => {
        $.getScript('https://cdn.jsdelivr.net/npm/marked@2.1.3/marked.min.js', function(){
            const html = marked(response.data);
            $scope.documentation = html;
            document.getElementById('documentation').innerHTML = html;
        });
    }).catch(err => document.getElementById('documentation').innerHTML = "documentation.md not found")
    

}

setSelectFolders(tasksPath);


