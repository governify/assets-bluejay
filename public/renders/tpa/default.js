// Display items and error alert
$scope.displayItems = {
    "statusMessage": '',
    "statusType": undefined,
    "scopeManagerInfo": {},
    "automaticComputation": false,
    "automaticComputationInfo": { id: 123, status: "stopped", script: "/asdf/script.js" }
};

const setPageAlert = (message, type) => {
    if (type === "error" || $scope.displayItems.statusType !== "error") {
        $scope.displayItems.statusMessage = message;
        $scope.displayItems.statusType = type;
    }
}

//Calculate Metrics button modal
$scope.dateNowISO = new Date().toISOString().match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d/g)[0];
$scope.calculateMetrics = {
    "timezone": "GMT+1:00",
    "timezones": [],
    "from": new Date(Date.parse("2023-02-09T00:00:00")),
    "to": new Date(Date.parse("2023-07-18T23:59:59")),
    "agree": false,
    "message": "",
    "error": false
}

const defaultDirectorRunTime = {
    "init": "2023-02-09T00:00:00", 
    "end": "2023-07-18T23:59:59",
    "interval": 7200000
}

$scope.swapAutomaticComputation = () => {
    if ($scope.displayItems.automaticComputation) {
        try {
            deleteUrl("$_[infrastructure.external.director.default]/api/v1/tasks/" + $scope.model.id, (err, data) => {
                // Reporter not answering properly
                if (err) {
                    setPageAlert("Automatic computation task could not be deactivated.", "error");
                    console.log(err)
                } else {
                    $scope.displayItems.automaticComputation = false;
                    $scope.displayItems.automaticComputationInfo = {};
                    $scope.$apply();
                }
            });
        } catch (err) {
            setPageAlert("Automatic computation task could not be deactivated.", "error");
            console.log(err)

        }
    } else {
        try {
            getUrl(
                "$_[infrastructure.external.assets.default]/api/v1/public/director/" + $scope.model.context.definitions.scopes.development.class.default + ".json",
                (err, data) => {
                    if (err) {
                        console.log("Director run time could not be found: ", $scope.model.context.definitions.scopes.development.class.default + ".json\n", err);
                    }
                    const task = {
                        "id": $scope.model.id,
                        "script": "$_[infrastructure.external.assets.default]/api/v1/public/director/" + $scope.model.context.definitions.scopes.development.class.default + ".js",
                        "running": true,
                        "config": {
                            "agreementId": $scope.model.id
                        },
                        "init": data ? data.init : "2023-02-09T00:00:00",
                        "end": data ? data.end : "2023-07-18T23:59:59",
                        "interval": data ? data.interval : 7200000
                    }
                    postUrl("$_[infrastructure.external.director.default]/api/v1/tasks", task, (err, data) => {
                        // Reporter not answering properly
                        if (err) {
                            setPageAlert("Automatic computation task could not be activated.", "error");
                            console.log(err)
                        } else {
                            $scope.displayItems.automaticComputation = true;
                            $scope.displayItems.automaticComputationInfo = data;
                            $scope.$apply();
                        }
                    });

                });
        } catch (err) {
            setPageAlert("Automatic computation task could not be activated.", "error");
            console.log(err)
        }
    }
}

// This function is called at the end of the code
const init = () => {
    try {
        for (let i = -11; i < 15; i++) {
            $scope.calculateMetrics.timezones.push("GMT" + (i < 0 ? "-" : "+") + Math.abs(i) + ":00")
        }

        //Get project Info from scopeManager
        getUrl(
            "$_[infrastructure.external.scopes.default]/api/v1/scopes/development/" + $scope.model.context.definitions.scopes.development.class.default + "/" + $scope.model.context.definitions.scopes.development.project.default,
            (err, data) => {
                if (data) {
                    if (data.code == 200) {
                        $scope.displayItems.scopeManagerInfo = data;
                    } else {
                        setPageAlert("No project found in ScopeManager with the specified scope (Some data will not be displayed).", "warn");
                    }
                }
                else {
                    setPageAlert("Error when retrieving information from Scope Manager (Some data will not be displayed).", "warn");
                }
                $scope.modelLoaded = $scope.modelLoaded == false ? true : false;
                $scope.$apply();
            }
        );

        //Get existing agreement from mongo
        getUrl(
            "$_[infrastructure.external.registry.default]/api/v6/agreements/" + $scope.model.id,
            (err, data) => {
                if (data) {
                    console.info("Loaded agreement from mongo.")
                    $scope.model = data;
                    $scope.collectorsUsed = Object.keys($scope.model.context.definitions.collectors);

                    //Get computation information from director
                    getUrl(
                        "$_[infrastructure.external.director.default]/api/v1/tasks/" + $scope.model.id,
                        (err, data) => {
                            if (err) {
                                $scope.displayItems.automaticComputation = false;
                                $scope.displayItems.automaticComputationInfo = {};
                                /* if (err.status === 404) {
                                    $scope.displayItems.automaticComputation = false;
                                } */
                            }
                            if (data) {
                                console.info("Loaded execution from director.");
                                $scope.displayItems.automaticComputation = true;
                                $scope.displayItems.automaticComputationInfo = data;
                            }
                            $scope.$apply();
                        }
                    );
                } else {
                    setPageAlert("No agreement found in mongo.", "error");
                    console.info("No agreement found in mongo, loaded default.");
                    $scope.$apply();
                }
                $scope.modelLoaded = $scope.modelLoaded == false ? true : false;
            }
        );
    } catch (err) {
        $scope.modelLoaded = true;
        console.log(err);
        if (!$scope.model) {
            setPageAlert("Model could not be loaded.", "error");
        } else {
            setPageAlert("Undefined Error.", "error");
        }
        $scope.$apply();
    }
}

$scope.beautifyMetric = (metric) => { return JSON.stringify(metric, null, 1); }

$scope.calculateEventsMetrics = function (id) {
    //Helper alert function
    const setModalAlert = (message, error = true) => { $scope.calculateMetrics.message = message; $scope.calculateMetrics.error = error; }

    try {
        setModalAlert("");

        if ($scope.calculateMetrics.agree) {

            if (!$scope.calculateMetrics.from || !$scope.calculateMetrics.to) {
                setModalAlert("Invalid date.");
            } else {
                // Periods generation
                var firstDateOffset = new Date(Date.parse($scope.calculateMetrics.from.toISOString())).getTimezoneOffset();
                var firstDate = Date.parse($scope.calculateMetrics.from.toISOString()) - firstDateOffset * 60 * 1000;

                var lastDateOffset = new Date(Date.parse($scope.calculateMetrics.to.toISOString())).getTimezoneOffset();
                var lastDate = Date.parse($scope.calculateMetrics.to.toISOString()) - lastDateOffset * 60 * 1000;
                console.log("Input", $scope.calculateMetrics.to.toISOString());
                console.log("UTC", new Date(lastDate).toISOString());

                var periodDifference = lastDate - firstDate;

                var timezoneOffset = $scope.calculateMetrics.timezone.split("T")[1].split(":")[0] * 60 * 60 * 1000;

                if (periodDifference <= 0) {
                    setModalAlert("End date must be higher than start date.");
                } else {
                    var periods = [{ "from": new Date(firstDate - timezoneOffset).toISOString(), "to": new Date(lastDate - timezoneOffset - 1).toISOString() }];
                    // POST
                    postUrl('$_[infrastructure.external.reporter.default]/api/v4/contracts/' + id + '/createPointsFromPeriods', { "periods": periods }, (err, data) => {
                        // Reporter not answering properly
                        /* if (err) {
                            console.log(err)
                            setModalAlert("Failed when creating points.");
                        } else {
                            setModalAlert("points created successfully!", false);
                        } */
                        setModalAlert("Points creation ended!", false);
                        $scope.$apply();
                    });

                    // Alert time estimation
                    setModalAlert("TPA data is being generated for the period.", false);
                }
            }
        } else {
            setModalAlert("You must agree to delete old information.");
        }
    } catch (err) {
        console.log(err)
        setModalAlert("Undefined error.");
    }
}

/**
 * GET request for https URLs
 * @param url 
 * @param callback 
 */
var getUrl = (url, callback) => {
    $.get(url, function (data) {
        if (callback) {
            callback(null, data);
        }
    }).fail(function (err) {
        if (callback) {
            callback(err, null);
        }
    });
};

/**
 * POST request for https URLs
 * @param url 
 * @param callback 
 */
var postUrl = (url, data, callback) => {
    if (!callback && data) {
        callback = data;
    }

    var body = {
        url: url,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        success: (data) => {
            if (callback) {
                callback(null, data);
            }
        }
    };

    if (data) {
        var rawContent = JSON.stringify(data);
        if (rawContent) {
            body["data"] = rawContent
                .replace(/&amp;/g, "&")
                .replace(/&gt;/g, ">")
                .replace(/&lt;/g, "<")
                .replace(/&quot;/g, '"');
        }
    }

    $.ajax(body).fail(function (err) {
        console.error(err);
        if (callback) {
            callback(err);
        }
    });
};

/**
 * DELETE request for https URLs
 * @param url 
 * @param callback 
 */
var deleteUrl = (url, data, callback) => {
    if (!callback && data) {
        callback = data;
    }

    $.ajax({
        url: url,
        type: "DELETE",
        success: (data) => {
            if (callback) {
                callback(null, data);
            }
        }
    }).fail(function (err) {
        console.error(err);
        if (callback) {
            callback(err);
        }
    });
};

init();



