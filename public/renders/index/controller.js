$scope.tpaprojects = [];
$scope.notpaprojects = [];
$scope.finishloading = false;

$scope.displayItems = {
    "course": "",
    "loadedCourses": false,
    "statusMessage": '',
    "statusType": undefined,
    "creatingTPA": false,
    "showHidden": false
}

var firstLoad = true;
var defaultProject = '';

$scope.developmentScopeJSON = {};

$scope.slackAdm = localStorage.getItem('slackWebHook') ? localStorage.getItem('slackWebHook') : null;
//interval between notifications in seconds
$scope.adminNotificationsInterval = localStorage.getItem('adminNotificationsInterval') ? localStorage.getItem('adminNotificationsInterval') : 1;
$scope.studentNotificationsInterval = localStorage.getItem('studentNotificationsInterval') ? localStorage.getItem('studentNotificationsInterval') : 1;
//TODO: true if one project has notifications for any tpaProjects
$scope.allAdminNotifications = false;
$scope.allStudentNotifications = false;

const setPageAlert = (message, type) => {
    $scope.displayItems.statusMessage = message;
    $scope.displayItems.statusType = type;
}

/* Check if it is already set up */
$http({
    method: 'GET',
    url: '$_[infrastructure.external.assets.default]/api/v1/public/renders/tpa/template.json'
}).then(tparesponse => {
    loadProjects();
}).catch(err => {
    setPageAlert("Template file could not be loaded.", "error");
    console.log(err);
});

function loadProjects() {
    try {
        var scopeTpaprojects = {};
        var scopeNotpaprojects = {};

        if (firstLoad) {
            $http({
                method: 'GET',
                url: '$_[infrastructure.external.scopes.default]/api/v1/scopes/development/courses'
            }).then((coursesResponse) => {
                $scope.developmentScopeJSON = [];

                // Add only not hidden projects
                for (let course of coursesResponse.data.scope) {
                    if ($scope.displayItems.showHidden || !course.hidden){
                        $scope.developmentScopeJSON.push(course);
                    }
                }

                $scope.displayItems.course = defaultProject ? defaultProject : $scope.developmentScopeJSON[0].classId;
                $scope.displayItems.loadedCourses = true;
                firstLoad = false;
                loadProjects();
            }, (err) => {
                setPageAlert("Scope Manager courses could not be loaded.", "error");
                $scope.finishloading = true;
                console.log(err);
            });
        } else {
            $http({
                method: 'GET',
                url: '$_[infrastructure.external.scopes.default]/api/v1/scopes/development/' + $scope.displayItems.course
            }).then(projectresponse => {
                $http({
                    method: 'GET',
                    url: '$_[infrastructure.external.registry.default]/api/v6/agreements'
                }).then(async (regresponse) => {
                    var projects = projectresponse.data.scope.projects;
                    var agreements = regresponse.data;
                    
                    await Promise.allSettled(projects.map(async project => {
                        const projectAgreementId = project.agreementId ? project.agreementId : 'tpa-' + project.projectId;
                        var found = agreements.find(agreement => agreement.id === projectAgreementId);
                        if (found) {
                            project.registryagreement = found;
                            scopeTpaprojects = clasifyProject(project, scopeTpaprojects);
                        } else {
                            scopeNotpaprojects = clasifyProject(project, scopeNotpaprojects);
                        }

                        if (project.notifications?.slack)
                        await $http({
                            method: 'GET',
                            url: `$_[infrastructure.external.director.default]/api/v1/tasks/slack-${project.projectId}`,
                        }).then( directorResponse => {
                            console.info("Loaded execution from director.");
                            project.toggleSlack = true;
                            project.slackTaskInfo = directorResponse.data;
                            project.notifications.slackAdm = directorResponse.data?.config?.slackAdm;
                        }).catch( directorErr => {
                            if (directorErr.status !== 404) console.log(directorErr);                
                        });
                    })).then(() => {
                        console.log({...scopeTpaprojects})

                        // This assign is for interval projects updating
                        $scope.tpaprojects = {...scopeTpaprojects};
                        $scope.tpaprojectskeys = Object.keys(scopeTpaprojects);
                        $scope.tpaprojectskeys = $scope.tpaprojectskeys.filter(item => item !== "Projects w/o owner");
                        $scope.tpaprojectskeys.push(Object.keys(scopeTpaprojects).filter(item => item === "Projects w/o owner")[0]);
                        $scope.notpaprojects = {...scopeNotpaprojects};
                        $scope.notpaprojectskeys = Object.keys(scopeNotpaprojects);
                        $scope.notpaprojectskeys = $scope.notpaprojectskeys.filter(item => item !== "Projects w/o owner");
                        $scope.notpaprojectskeys.push(Object.keys(scopeNotpaprojects).filter(item => item === "Projects w/o owner")[0]);
                        $scope.finishloading = true;
                    }).catch(err => {;
                        setPageAlert("Comparing registry projects failed.", "error");
                        $scope.finishloading = true;
                        console.log(err);
                    });
                }).catch((err) => {
                    setPageAlert("Error when obtaining registry agreements.", "error");
                    $scope.finishloading = true;
                    console.log(err);
                });
            }, (err) => {
                setPageAlert("Scope Manager courses could not be loaded.", "error");
                $scope.finishloading = true;
                console.log(err);
            });
        }
    } catch (err) {
        setPageAlert("Projects loading failed.", "error");
        $scope.finishloading = true;
        console.log(err);
    }
}

const clasifyProject = (project, container) => {
    if (project.owner === undefined || project.owner === "") {
        if (Object.keys(container).includes("Projects w/o owner")) {
            container["Projects w/o owner"].push(project);
        } else {
            container["Projects w/o owner"] = [];
            container["Projects w/o owner"].push(project);
        }
    } else {
        if (Object.keys(container).includes(project.owner)){
            container[project.owner].push(project);
        } else {
            container[project.owner] = [];
            container[project.owner].push(project);
        }
    }

    return container;
}

// For load course button
$scope.reloadProjects = function () {
    $scope.finishloading = false;
    loadProjects();
}

$scope.createTpa = function (project, openTab = true) {
    $scope.displayItems.creatingTPA = true;
    getTemplate($scope.displayItems.course).then(tparesponse => {
        try {
            const projectIdNumber = project.projectId;
            var tpa = JSON.parse(JSON.stringify(tparesponse.data).replace(/1010101010/g, projectIdNumber).replace(/2020202020/g, $scope.displayItems.course));

            tpa.id = project.agreementId ? project.agreementId : 'tpa-' + projectIdNumber;

            tpa.context.validity.initial = '2019-01-01';
            tpa.context.definitions.scopes.development.project.default = projectIdNumber;

            $http({
                method: 'POST',
                url: '$_[infrastructure.external.registry.default]/api/v6/agreements',
                data: tpa
            }).then(() => {
                setPageAlert("TPA created successfully.", "success");
                $scope.displayItems.creatingTPA = false;
                loadProjects();
                if (openTab) {
                    window.open("$_[infrastructure.external.render.default]/render?model=$_[infrastructure.internal.registry.default]/api/v6/agreements/" + tpa.id + "&view=$_[infrastructure.internal.assets.default]/api/v1/public/renders/tpa/default.html&ctrl=$_[infrastructure.internal.assets.default]/api/v1/public/renders/tpa/default.js", "_blank");
                }
                $scope.finishloading = true;
            }, (err) => {
                setPageAlert("There was a problem when sending TPA to registry.", "error");
                $scope.displayItems.creatingTPA = false;
                console.log(err);
            });
        } catch (err) {
            setPageAlert("Problem when creating TPA.", "error");
            $scope.displayItems.creatingTPA = false;
            console.log(err);
        }
    }, (err) => {
        setPageAlert("Problem when creating TPA.", "error");
        $scope.displayItems.creatingTPA = false;
        console.log(err);
    });
}

// Tries to return courseId.json template and if it is not found returns template.json
const getTemplate = (courseId) => {
    return new Promise ((resolve, reject) => {
        $http({
            method: 'GET',
            url: '$_[infrastructure.external.assets.default]/api/v1/public/renders/tpa/' + courseId + '.json'
        }).then((tparesponse) => {
            resolve(tparesponse);
        }).catch(err => {
            if (err.status === 404 && courseId !== 'template') {
                resolve(getTemplate('template'));
            } else {
                reject(err);
            }
        });
    });
}

$scope.createAllTpas = (projects) => {
    for (const project of projects[Object.keys(projects)[0]]){
        $scope.createTpa(project, false);
    }
}

$scope.swapShowHidden = function () {
    $scope.displayItems.showHidden = !$scope.displayItems.showHidden;
    firstLoad = true;
    loadProjects();
}

$scope.togggleSlackbot = function (project) {
    const projectId = project.projectId;
    const classId = project.registryagreement ? project.registryagreement?.context?.definitions?.scopes?.development?.class?.default : $scope.displayItems.course;

    if (project.toggleSlack) {
        $http({
            method: 'DELETE',
            url: `$_[infrastructure.external.director.default]/api/v1/tasks/slack-${projectId}`
        }).then(() => {
            project.toggleSlack = false;
            project.slackTaskInfo = null;
        }).catch(err => {
            setPageAlert("Slackbot task could not be deactivated.", "error");
            console.log(err);
        });
    } else {
        $http({
            method: 'GET',
            url: `$_[infrastructure.external.assets.default]/api/v1/info/public/director/notificationScriptSimpl.js`
        }).then(() => {
            const task = {
                id: `slack-${projectId}`,
                script: `$_[infrastructure.internal.assets.default]/api/v1/public/director/notificationScriptSimpl.js`,
                running: true,
                config: {
                    classId: classId,
                    projectId: projectId,
                    initialDate: new Date().toISOString(),
                    finalDate: new Date((new Date().getTime() + 8000 * 365)).toISOString(),
                    slackHook: project.notifications.slack,
                },
                init: new Date().toISOString(),
                end: new Date((new Date().getTime() + 8000 * 365)).toISOString(),
                interval: 8000,
            }

            $http({
                method: 'POST',
                url: `$_[infrastructure.external.director.default]/api/v1/tasks`,
                headers: { 'Content-Type': 'application/json' },
                data: task
            }).then((directorResponse) => {
                console.log(`Slackbot task activated for project ${projectId} until ${task.end}`);
                project.slackTaskInfo = directorResponse.data;
                project.toggleSlack = true;
            }).catch(err => {
                setPageAlert("Slackbot task could not be activated.", "error");
                console.log(err);
            });
        });
    }
}
$scope.toggleAdmSlackbot = function (project) {
    const projectId = project.projectId;
    const classId = project.registryagreement ? project.registryagreement?.context?.definitions?.scopes?.development?.class?.default : $scope.displayItems.course;
    if (project.toggleAdmSlack) {
        console.log("deleting")
        $http({
            method: 'DELETE',
            url: `$_[infrastructure.external.director.default]/api/v1/tasks/slack-${projectId}-admin`
        }).then(() => {
            project.toggleAdmSlack = false;
            project.slackTaskInfo = null;
        }).catch(err => {
            setPageAlert("Slackbot task could not be deactivated.", "error");
            console.log(err);
        });
    } else {
        console.log("adding")
        $http({
            method: 'GET',
            url: `$_[infrastructure.external.assets.default]/api/v1/info/public/director/notificationScriptSimpl.js`
        }).then(() => {
            const task = {
                id: `slack-${projectId}-admin`,
                script: `$_[infrastructure.internal.assets.default]/api/v1/public/director/notificationScriptSimpl.js`,
                running: true,
                config: {
                    classId: classId,
                    projectId: projectId,
                    initialDate: new Date().toISOString(),
                    finalDate: new Date((new Date().getTime() + $scope.adminNotificationsInterval*1000 * 365)).toISOString(),
                    slackHook: project.notifications.slackAdm,
                },
                init: new Date().toISOString(),
                end: new Date((new Date().getTime() + $scope.adminNotificationsInterval*1000 * 365)).toISOString(),
                interval: $scope.adminNotificationsInterval*1000,
            }

            $http({
                method: 'POST',
                url: `$_[infrastructure.external.director.default]/api/v1/tasks`,
                headers: { 'Content-Type': 'application/json' },
                data: task
            }).then((directorResponse) => {
                console.log(`Slackbot task activated for project ${projectId} until ${task.end}`);
                project.slackTaskInfo = directorResponse.data;
                project.toggleAdmSlack = true;
            }).catch(err => {
                setPageAlert("Slackbot task could not be activated.", "error");
                console.log(err);
            });
        });
    }
}
$scope.toggleAllAdmSlack = function (ev) {
    if(!$scope.allAdminNotifications){//activate
        if (!$scope.slackAdm) {
            ev.preventDefault();
            setPageAlert("Slackbot admin mode could not be activated. Slackbot admin hook is not set.", "error")
        }else{
            console.log("activated all projects notifications")
            for (const key in $scope.tpaprojects) {
                const project = $scope.tpaprojects[key][0];
                if(project.notifications){
                    project.notifications.slackAdm = $scope.slackAdm
                }else{
                    project.notifications = {"slackAdm" : $scope.slackAdm};
                }
                console.log(project.notifications);
                $scope.toggleAdmSlackbot(project)
            }
            $scope.allAdminNotifications = true;
        }

    }else{//deactivate
        console.log("deactivated all projects notifications")
        for (const key in $scope.tpaprojects) {
            const project = $scope.tpaprojects[key][0];
            if (project.notifications.slackAdm) {
                delete project.notifications.slackAdm;
            }

            $scope.toggleAdmSlackbot(project)
        }
        $scope.allAdminNotifications = false;

    }
    console.log($scope.tpaprojects);
}

$scope.toggleAllSlack= function($event){
    console.log($scope.studentNotificationsInterval);
}
$scope.setAdminWebhook = function (evt) {
    const input = evt.target.parentElement.children[0];
    if (input.value) {
        $scope.slackAdm = input.value;
        localStorage.setItem("slackWebHook", input.value);
        setPageAlert("Slackbot admin hook successfully configured.", "success");
    } else {
        setPageAlert("Invalid webhook.", "error");
    }
}

/**
 * 
 * Sets the time in seconds between notifications.
 * Stores the value in localStorage
 * 
 * @param {*} evt 
 * @param {*} forAdmin  true = admin, false = students
 */
$scope.setSlackInterval = function (evt,forAdmin) {

    const input = evt.target.parentElement.children[0];
    if (input.value && !isNaN(input.value)) {
        forAdmin ? $scope.adminNotificationsInterval = input.value 
            : $scope.studentNotificationsInterval = input.value;
        
        localStorage.setItem(forAdmin?"adminNotificationsInterval":"studentNotificationsInterval", input.value);
        setPageAlert("Notification interval for "+(forAdmin?"admin":"students")+" successfully configured. (Needs restart)", "success");
    } else {
        setPageAlert("Invalid interval.", "error");
    }
}