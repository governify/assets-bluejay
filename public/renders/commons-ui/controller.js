const director_script_template = "governify = require('governify-commons'); module.exports = { main: async function() {const options = [options]; let promise = {}; await governify.httpClient.request(options).then(r => promise = r.data).catch(e => promise = e.response ? e.response : {}); return promise}};"

$scope.services = {};
$scope.editing = false;
$scope.logging_levels = [{num:1, text:"DEBUG"},{num:2, text:"INFO"},{num:3, text:"WARN"},{num:4, text:"ERROR"},{num:5, text:"FATAL"}]
$scope.alert = {}
$scope.finishloading = false;

async function load_data(){
    // Check if task exist, create task otherwise
    let task = {
        id: "get_services_status", 
        script: "$_[infrastructure.internal.assets.default]/api/v1/public/director/check-status.js"
    };
    await $http({
        method: 'GET',
        url: `$_[infrastructure.external.director.default]/api/v1/tasks/${task.id}`
    }).then(() => {
        run_task(task.id);
    })
    .catch(async (err) => {
        if(err.status === 404){
            console.warn("Task not found, creating task...")
            await create_task(task.id, task.script);

            run_task(task.id);
        } else {
            console.log("Couldn`t connect to Director: " + err.status);
            create_alert('danger', "Unexpected Error", "Couldn't connect to Director");
            $scope.services = {};
        }       
    });
    $scope.finishloading = true;
}

async function create_task(taskId, script){
    return $http({
        method: 'POST',
        url: `$_[infrastructure.external.director.default]/api/v1/tasks`,
        data:  {
            id: taskId,
            script: script,
            running: false,
            config: {},
            init: "2023-02-09T00:00:00",
            interval: 10000000000,
            end: "2023-07-18T23:59:59"
        }
    }).catch(err => {
        console.log("Error on task creation: " + err.status);
        create_alert('danger', "Unexpected Error", "Couldn't create task");
    });
}

function run_task(taskId){
    $http({
        method: 'POST',
        url: `$_[infrastructure.external.director.default]/api/v1/tasks/${taskId}/run`,
    }).then(response => {
        if(Object.keys(response.data).length !== 0){
            $scope.services = response.data;
        } else {
            create_alert('danger', "Unexpected Error", "Couldn't get infrastructure");
        }

        set_view_css() //set up view props

    }).catch(err => {
        console.log(err);
        create_alert('danger', "Unexpected Error", err.status);
    });
}

// App logic
$scope.accept_edit = async function(service){
    if($scope.editing && !service.down){
        
        $(`#${service.serviceName}-confirm`).children(":first").removeClass('fa-check').addClass('fa-spinner');
        $(`#${service.serviceName}-confirm`).css("pointer-events", "none");     //disable pointer evts
        $(`#${service.serviceName}-confirm`).addClass("fa-spin");               //spin animation
        $(`#${service.serviceName}-cancel`).prop("disabled", true);             //disable cancel button

        await Promise.all([update_rlogging(service), update_logger_cfg(service)])
                    .catch(err => {
                        console.log(err);
                        if(err.response){
                            create_alert('danger', "Unexpected Error", "response code: " + err.response.status);
                        } else{
                            create_alert("danger", "Unexpected Error", err.message);
                        }
                    });
        await load_data();

        service.modify = false
        $scope.editing = false;
    }
}

async function update_rlogging(service){
    // updates request logging attribute through director call
    
    let req_log_config = service.requestLogging === 'true' ? 'enable' : 'disable';
            
    let options = `{method: 'POST', url: '${service.url}/commons/requestLogging/${req_log_config}'}`;
    let script = director_script_template.replace('[options]', options);

   await $http({
        method: 'POST',
        url: '$_[infrastructure.external.director.default]/api/v1/tasks/test',
        data: {scriptText : script, scriptConfig: {agreementId: 123127}}
    }).then(res => {
        if(typeof(res.data) === "object"){
            if(Object.keys(res.data).length === 0) {
                throw ({code: -1, message: "Service is not responding"});
            } else if (res.data.status !== 200) {
                throw res.data;
            }
        } 
    }).catch(err => {
        throw (err);
    }) 
}

async function update_logger_cfg(service){
    // updates logging config attributes through director call

    let options = `{method: 'POST', url: '${service.url}/commons/logger/config', data: ${JSON.stringify(service.logger_config)}}`;
    let script = director_script_template.replace('[options]', options);

    await $http({
        method: 'POST',
        url: '$_[infrastructure.external.director.default]/api/v1/tasks/test',
        data: {scriptText : script, scriptConfig: {agreementId: 123127}}
    }).then(res => {
        if(typeof(res.data) === "object"){
            if(Object.keys(res.data).length === 0) {
                throw ({code: -1, message: "Service is not responding"});
            } else if (res.data.status !== 200) {
                throw res.data;
            }
        }
    }).catch(err => {
        throw (err);
    });
}

$scope.cancel_edit = async function(service){
    if($scope.editing && !service.down){
        $(`#${service.serviceName}-cancel`).children(":first").removeClass('fa-times').addClass('fa-spinner');
        $(`#${service.serviceName}-cancel`).css("pointer-events", "none");     //disable pointer evts
        $(`#${service.serviceName}-cancel`).addClass("fa-spin");               //spin animation
        $(`#${service.serviceName}-confirm`).prop("disabled", true);           //disable confirm button

        await load_data();

        service.modify = false
        $scope.editing = false;
    }
}

$scope.update_infrastructure = function(service){
    if(!$scope.editing && !service.down){

        // Use Director as proxy to update internal services
        let options = `{method: 'POST', url: '${service.url}/commons/infrastructure/update'}`;
        let script = director_script_template.replace('[options]', options);

        $http({
            method: 'POST',
            url: '$_[infrastructure.external.director.default]/api/v1/tasks/test',
            data: {scriptText : script, scriptConfig: {agreementId: 123127}}
        }).then(() => {
            create_alert('success', 'Done', `Successfully updated ${service.serviceName} infrastructure`);
        }).catch(err => {
            create_alert('danger', 'Error', `Could not update service infrastructure, code: ${err.status}`);
        });

    }
}

$scope.go_to = function(service) {
    if(!service.down){
        window.open(service.external_url);
    }
}

// View functions
$scope.toggle_collapse = function(event){
    let panel = event.currentTarget;
    let content = panel.nextElementSibling;
    content.style.display = content.style.display === "none" ? "grid" : "none";
}

$scope.toggle_edit = function(service){
    if(!$scope.editing && !service.down){
        service.modify = true
        $scope.editing = true;
    }
}

$scope.close_alert = function(){
    $scope.alert = {};
}

function create_alert(type, header, msg){
    $scope.alert = {type: type, header: header, msg: msg}
}

// Setup some css view props
function set_view_css(){
    $(document).ready(() => {
        // enable tooltips
        $('[data-bs-toggle="tooltip"]').tooltip({trigger: 'hover'});
        $('[data-bs-toggle="tooltip"]').on('mouseleave', function () {
            $(this).tooltip('hide');
        });
        $('[data-bs-toggle="tooltip"]').on('click', function () {
            $(this).tooltip('hide');
        });
        // highlight all table rows when hovering a service
        $(document).on('mouseenter', 'tr', function(evt){
            let element = evt.currentTarget;
            if(element.classList[0]){
                let trs = $(`.${element.classList[0]}`).not(evt.currentTarget);
                trs.css("--bs-table-accent-bg", "rgba(0, 0, 0, 0.075)")
            }
        });
        $(document).on('mouseleave', 'tr', function(evt){
            let element = evt.currentTarget;
            if(element.classList[0]){
                let trs = $(`.${element.classList[0]}`).not(evt.currentTarget);
                trs.css("--bs-table-accent-bg", "")
            }
        });
    }); 
}

// load data to render in view
load_data();