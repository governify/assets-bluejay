$scope.databases = [];
$scope.dbSelected = {};
$scope.alertMsg = '';
$scope.files;
$scope.processOngoing = {text:'' , loading:false}

var buildPayload = (scriptText,scriptConfig) => {
    return { 
        "scriptText" : scriptText,
        "scriptConfig" : scriptConfig
    }
}

$scope.loadDatabases = async () => {
    $scope.databases = [];
    await $http({
        method: 'GET',
        url: '$_[infrastructure.external.render.default]/commons/infrastructure'
    }).then(async(res)=>{
        let temp = res.data.internal.database
        delete temp.default

        for(let value of Object.entries(temp)){
            try{
                let dbTypeTemp = value[0].split('-')[0]
                let dbType = dbTypeTemp.charAt(0).toUpperCase() + dbTypeTemp.slice(1); 
                if(dbType !== 'Mongo' && dbType !== 'Influx') continue;
                let url = '$_[infrastructure.external.assets.default]/api/v1/info/public/database/backups/'+value[0];
                let records = []
                await $http.get(url).then(data => {
                    records = data.data.files.sort((a,b)=>{
                        let res = new Date(a.lastModified) < new Date(b.lastModified)
                        return res?1:-1
                    })
                }).catch(()=>{
                    return;
                })
                $scope.databases.push({
                    dbName: value[0],
                    dbUrl: value[1],
                    dbType,
                    records
                });
            }catch(_){
                continue;
            }
        }
    },(err)=>{
        console.error(err)
    })
};

$scope.loadDatabases()

async function getFromAssets(url){
   var res = await $http.get(url).then((res) => {
        return res.data;
    }).catch((err)=>{
        console.error(err);
    })

    return res
}

$scope.makeBackup = async (db) => {
    var script,
        url;

    const urlTestScript = '$_[infrastructure.external.director.default]/api/v1/tasks/test';

    url = '$_[infrastructure.external.assets.default]/api/v1/public/database/dbBackup.js';

    script = await getFromAssets(url);

    const dbConfig = {
        dbName: db.dbName,
        dbUrl: db.dbUrl,
        dbType: db.dbType,
    }
    $scope.processOngoing = {text:`Saving backup for ${db.dbName}` , loading:true}
    var bodyScriptTest = buildPayload(script,dbConfig);
    $http.post(urlTestScript,bodyScriptTest).then(() => {
        $scope.processOngoing = {text:'' , loading:false}
        $scope.openAlert('backupAlert','La base de datos se ha salvado correctamente','alert-primary');
        $scope.loadDatabases()
    }).catch((err)=>{
        $scope.processOngoing = {text:'' , loading:false}
        $scope.openAlert('backupAlert','Algo ha ido mal pruebe de nuevo o compruebe el estado de los servicios','alert-danger');
    })  
}

$scope.restoreBackup = async (db, backup) => {
    var script,
        url;

    const urlTestScript = '$_[infrastructure.external.director.default]/api/v1/tasks/test';

    url = '$_[infrastructure.external.assets.default]/api/v1/public/database/dbRestore.js';

    script = await getFromAssets(url);
    
    const dbConfig = {
        dbName: db.dbName,
        dbUrl: db.dbUrl,
        dbType: db.dbType,
        backup: backup.name
    }

    var bodyScriptTest = buildPayload(script,dbConfig);
    $scope.processOngoing = {text:`Restoring ${db.dbName}` , loading:true}
    $http.post(urlTestScript,bodyScriptTest).then(() => {
        $scope.processOngoing = {text:'' , loading:false}
        $scope.openAlert('backupAlert','La base de datos se ha restaurando correctamente','alert-primary');
    }).catch(()=>{
        $scope.processOngoing = {text:'' , loading:false}
        $scope.openAlert('backupAlert','Algo ha ido mal pruebe de nuevo o compruebe el estado de los servicios','alert-danger');
    })
}

$scope.loadRegister = async (db) =>{
    $scope.dbSelected = db;
}

$scope.downloadBD = async (dbName,backup) =>{
    var url = '$_[infrastructure.external.assets.default]/api/v1/public/database/backups/' + dbName + "/" + backup.name;
    window.open(url);
}

$scope.openAlert = (alert,msg,type) =>{
    var alert = document.getElementById(alert);
    $scope.alertMsg = msg
    alert.classList.add('show',type);

    setTimeout(function() {
        alert.classList.remove('show',type);
        $scope.alertMsg = ''
    }, 5000);
}

$scope.closeAlert = (alert) =>{
    var alert = document.getElementById(alert);
    alert.classList.remove('show')
}

$scope.submitFile = () =>{

    var element = document.getElementById('file')
    var backupFile = element.files[0];

    var fd=new FormData();
    fd.append('file',backupFile);

    var config = { headers: { 'Content-Type': undefined },
                transformResponse: angular.identity
                };
    var url = '$_[infrastructure.external.assets.default]/api/v1/public/database/backups/' + $scope.dbSelected.dbName + "/?createDirectories=true";

    $http.post(url,fd,config).then(()=>{
        $scope.loadDatabases()
        $scope.openAlert('backupAlert','Archivo subido correctamente','alert-primary');
    }).catch(err =>{ 
        console.error(err);
        $scope.openAlert('backupAlert','Error al subir archivo','alert-danger');
    })

    var loadBackupModal = document.getElementById('loadBackupModal')
    var modal = bootstrap.Modal.getInstance(loadBackupModal)
    modal.hide()
}

$scope.deleteElement = async (dbName, backup) => {
    var url = '$_[infrastructure.external.assets.default]/api/v1/public/database/backups/' + dbName + "/" + backup.name;
    console.log(url)
    $http.delete(url).then((res) => {
        $scope.loadDatabases()
        $scope.openAlert('backupAlert','El fichero ' + backup.name + ' ha sido eliminado','alert-primary');
    }).catch(()=>{
        $scope.openAlert('backupAlert','Algo ha ido mal pruebe de nuevo o compruebe el estado de los servicios','alert-danger');
    })
}