
'use strict';

module.exports.modifyJSON = modifyJSON;

const atoms = {
    "rowTitle": {
        "title": "###GUARANTEE.DESCRIPTION###",
        "type": "row",
        "collapsed": false,
        "datasource": null,
        "gridPos": {
            "h": 1,
            "w": 24,
            "x": 0,
            "y": 0
        },
        "id": 53,
        "panels": [],
    },
    "gaugeLast5Days": {
        "title": "Last 5 days mean percentage",
        "guarantee": "###GUARANTEE.NAME###",
        "type": "gauge",
        "datasource": "InfluxDB",
        "fieldConfig": {
            "defaults": {
                "custom": {},
                "mappings": [],
                "max": 100,
                "min": 0,
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                        {
                            "color": "red",
                            "value": null
                        },
                        {
                            "color": "yellow",
                            "value": 50
                        },
                        {
                            "color": "green",
                            "value": 75
                        }
                    ]
                }
            },
            "overrides": []
        },
        "gridPos": {
            "h": 9,
            "w": 4,
            "x": 0,
            "y": 1
        },
        "id": 2,
        "options": {
            "orientation": "auto",
            "reduceOptions": {
                "calcs": [
                    "mean"
                ],
                "values": false
            },
            "showThresholdLabels": false,
            "showThresholdMarkers": true
        },
        "pluginVersion": "7.0.0",
        "targets": [
            {
                "groupBy": [
                    {
                        "params": [
                            "$__interval"
                        ],
                        "type": "time"
                    },
                    {
                        "params": [
                            "null"
                        ],
                        "type": "fill"
                    }
                ],
                "measurement": "metrics_values",
                "orderByTime": "ASC",
                "policy": "autogen",
                "query": "SELECT mean(\"guaranteeValue\") FROM \"autogen\".\"metrics_values\" WHERE (\"agreement\" = '###AGREEMENT.ID###' AND \"id\" = '###GUARANTEE.NAME###') AND time < now() AND time >= now() -500d GROUP BY time($__interval) fill(null)",
                "rawQuery": true,
                "refId": "A",
                "resultFormat": "time_series",
                "select": [
                    [
                        {
                            "params": [
                                "guaranteeValue"
                            ],
                            "type": "field"
                        },
                        {
                            "params": [],
                            "type": "mean"
                        }
                    ]
                ],
                "tags": [
                    {
                        "key": "agreement",
                        "operator": "=",
                        "value": "###AGREEMENT.ID###"
                    },
                    {
                        "condition": "AND",
                        "key": "id",
                        "operator": "=",
                        "value": "###GUARANTEE.NAME###"
                    }
                ]
            }
        ],
        "timeFrom": null,
        "timeShift": null
    },
    "gaugeLast5DaysNotZero": {
        "title": "Last 5 days mean percentage",
        "guarantee": "###GUARANTEE.NAME###",
        "type": "gauge",
        "datasource": "InfluxDB",
        "fieldConfig": {
            "defaults": {
                "custom": {},
                "mappings": [],
                "max": 100,
                "min": 0,
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                        {
                            "color": "red",
                            "value": null
                        },
                        {
                            "color": "yellow",
                            "value": 50
                        },
                        {
                            "color": "green",
                            "value": 75
                        }
                    ]
                }
            },
            "overrides": []
        },
        "gridPos": {
            "h": 9,
            "w": 4,
            "x": 0,
            "y": 1
        },
        "id": 2,
        "options": {
            "orientation": "auto",
            "reduceOptions": {
                "calcs": [
                    "mean"
                ],
                "values": false
            },
            "showThresholdLabels": false,
            "showThresholdMarkers": true
        },
        "pluginVersion": "7.0.0",
        "targets": [
            {
                "groupBy": [
                    {
                        "params": [
                            "$__interval"
                        ],
                        "type": "time"
                    },
                    {
                        "params": [
                            "null"
                        ],
                        "type": "fill"
                    }
                ],
                "measurement": "metrics_values",
                "orderByTime": "ASC",
                "policy": "autogen",
                "query": "SELECT mean(\"guaranteeValue\") FROM \"autogen\".\"metrics_values\" WHERE (\"agreement\" = '###AGREEMENT.ID###' AND \"id\" = '###GUARANTEE.NAME###' AND \"###METRIC.NOTZERO###\" != 0) AND time < now() AND time >= now() -500d GROUP BY time($__interval) fill(null)",
                "rawQuery": true,
                "refId": "A",
                "resultFormat": "time_series",
                "select": [
                    [
                        {
                            "params": [
                                "guaranteeValue"
                            ],
                            "type": "field"
                        },
                        {
                            "params": [],
                            "type": "mean"
                        }
                    ]
                ],
                "tags": [
                    {
                        "key": "agreement",
                        "operator": "=",
                        "value": "###AGREEMENT.ID###"
                    },
                    {
                        "condition": "AND",
                        "key": "id",
                        "operator": "=",
                        "value": "###GUARANTEE.NAME###"
                    }
                ]
            }
        ],
        "timeFrom": null,
        "timeShift": null
    },
    "timeGraph": {
        "title": "###TIME_GRAPH.TITLE###",
        "guarantee": "###GUARANTEE.NAME###",
        "type": "graph",
        "aliasColors": {},
        "bars": false,
        "dashLength": 10,
        "dashes": false,
        "datasource": "InfluxDB",
        "fieldConfig": {
            "defaults": {
                "custom": {},
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                        {
                            "color": "green",
                            "value": null
                        },
                        {
                            "color": "red",
                            "value": 80
                        }
                    ]
                }
            },
            "overrides": []
        },
        "fill": 1,
        "fillGradient": 0,
        "gridPos": {
            "h": 9,
            "w": 20,
            "x": 4,
            "y": 1
        },
        "hiddenSeries": false,
        "id": 4,
        "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
        },
        "lines": true,
        "linewidth": 1,
        "nullPointMode": "null",
        "options": {
            "dataLinks": []
        },
        "percentage": false,
        "pluginVersion": "7.0.0",
        "pointradius": 2,
        "points": true,
        "renderer": "flot",
        "seriesOverrides": [],
        "spaceLength": 10,
        "stack": false,
        "steppedLine": false,
        "targets": [
            {
                "groupBy": [
                    {
                        "params": [
                            "$__interval"
                        ],
                        "type": "time"
                    },
                    {
                        "params": [
                            "none"
                        ],
                        "type": "fill"
                    }
                ],
                "measurement": "metrics_values",
                "orderByTime": "ASC",
                "policy": "autogen",
                "refId": "A",
                "resultFormat": "time_series",
                "select": [
                    [
                        {
                            "params": [
                                "guaranteeValue"
                            ],
                            "type": "field"
                        },
                        {
                            "params": [],
                            "type": "mean"
                        }
                    ]
                ],
                "tags": [
                    {
                        "key": "agreement",
                        "operator": "=",
                        "value": "###AGREEMENT.ID###"
                    },
                    {
                        "condition": "AND",
                        "key": "id",
                        "operator": "=",
                        "value": "###GUARANTEE.NAME###"
                    }
                ]
            }
        ],
        "thresholds": [
            {
                "colorMode": "critical",
                "fill": true,
                "line": false,
                "op": "lt",
                "value": "###GUARANTEE.THRESHOLD###",
                "yaxis": "left"
            }
        ],
        "timeFrom": null,
        "timeRegions": [],
        "timeShift": null,
        "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
        },
        "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
        },
        "yaxes": [
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": null,
                "min": null,
                "show": true
            },
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": null,
                "min": null,
                "show": true
            }
        ],
        "yaxis": {
            "align": false,
            "alignLevel": null
        }
    },
    "timeGraphMember": {
        "title": "###TIME_GRAPH.TITLE###",
        "guarantee": "###GUARANTEE.NAME###",
        "type": "graph",
        "aliasColors": {},
        "bars": false,
        "dashLength": 10,
        "dashes": false,
        "datasource": "InfluxDB",
        "fieldConfig": {
            "defaults": {
                "custom": {},
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                        {
                            "color": "green",
                            "value": null
                        },
                        {
                            "color": "red",
                            "value": 80
                        }
                    ]
                }
            },
            "overrides": []
        },
        "fill": 1,
        "fillGradient": 0,
        "gridPos": {
            "h": 9,
            "w": 20,
            "x": 4,
            "y": 1
        },
        "hiddenSeries": false,
        "id": 4,
        "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
        },
        "lines": true,
        "linewidth": 1,
        "nullPointMode": "null",
        "options": {
            "dataLinks": []
        },
        "percentage": false,
        "pluginVersion": "7.0.0",
        "pointradius": 2,
        "points": true,
        "renderer": "flot",
        "seriesOverrides": [],
        "spaceLength": 10,
        "stack": false,
        "steppedLine": false,
        "targets": [
            {
                "groupBy": [
                    {
                        "params": [
                          "scope_member"
                        ],
                        "type": "tag"
                      }
                ],
                "measurement": "metrics_values",
                "orderByTime": "ASC",
                "policy": "autogen",
                "refId": "A",
                "resultFormat": "time_series",
                "select": [
                    [
                        {
                            "params": [
                                "guaranteeValue"
                            ],
                            "type": "field"
                        }
                    ]
                ],
                "tags": [
                    {
                        "key": "agreement",
                        "operator": "=",
                        "value": "###AGREEMENT.ID###"
                    },
                    {
                        "condition": "AND",
                        "key": "id",
                        "operator": "=",
                        "value": "###GUARANTEE.NAME###"
                    }
                ]
            }
        ],
        "thresholds": [
            {
                "colorMode": "critical",
                "fill": true,
                "line": false,
                "op": "lt",
                "value": "###GUARANTEE.THRESHOLD###",
                "yaxis": "left"
            }
        ],
        "timeFrom": null,
        "timeRegions": [],
        "timeShift": null,
        "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
        },
        "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
        },
        "yaxes": [
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": null,
                "min": null,
                "show": true
            },
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": null,
                "min": null,
                "show": true
            }
        ],
        "yaxis": {
            "align": false,
            "alignLevel": null
        }
    },
    "timeGraphPercent": {
        "title": "###TIME_GRAPH.TITLE###",
        "guarantee": "###GUARANTEE.NAME###",
        "type": "graph",
        "aliasColors": {},
        "bars": false,
        "dashLength": 10,
        "dashes": false,
        "datasource": "InfluxDB",
        "fieldConfig": {
            "defaults": {
                "custom": {},
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                        {
                            "color": "green",
                            "value": null
                        },
                        {
                            "color": "red",
                            "value": 80
                        }
                    ]
                }
            },
            "overrides": []
        },
        "fill": 1,
        "fillGradient": 0,
        "gridPos": {
            "h": 9,
            "w": 20,
            "x": 4,
            "y": 1
        },
        "hiddenSeries": false,
        "id": 4,
        "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
        },
        "lines": true,
        "linewidth": 1,
        "nullPointMode": "null",
        "options": {
            "dataLinks": []
        },
        "percentage": false,
        "pluginVersion": "7.0.0",
        "pointradius": 2,
        "points": true,
        "renderer": "flot",
        "seriesOverrides": [
            {
                "alias": "Team",
                "color": "#3274D9"
            },
            {
                "alias": "Class mean",
                "color": "rgb(155, 155, 155)",
                "points": false
            }
        ],
        "spaceLength": 10,
        "stack": false,
        "steppedLine": false,
        "targets": [
            {
                "alias": "Team",
                "groupBy": [
                    {
                        "params": [
                            "$__interval"
                        ],
                        "type": "time"
                    },
                    {
                        "params": [
                            "none"
                        ],
                        "type": "fill"
                    }
                ],
                "measurement": "metrics_values",
                "orderByTime": "ASC",
                "policy": "autogen",
                "refId": "A",
                "resultFormat": "time_series",
                "select": [
                    [
                        {
                            "params": [
                                "guaranteeValue"
                            ],
                            "type": "field"
                        },
                        {
                            "params": [],
                            "type": "mean"
                        }
                    ]
                ],
                "tags": [
                    {
                        "key": "agreement",
                        "operator": "=",
                        "value": "###AGREEMENT.ID###"
                    },
                    {
                        "condition": "AND",
                        "key": "id",
                        "operator": "=",
                        "value": "###GUARANTEE.NAME###"
                    }
                ]
            },
            {
                "alias": "Class mean",
                "groupBy": [
                    {
                        "params": [
                            "$__interval"
                        ],
                        "type": "time"
                    },
                    {
                        "params": [
                            "none"
                        ],
                        "type": "fill"
                    }
                ],
                "measurement": "metrics_values",
                "orderByTime": "ASC",
                "policy": "autogen",
                "refId": "B",
                "resultFormat": "time_series",
                "select": [
                    [
                        {
                            "params": [
                                "guaranteeValue"
                            ],
                            "type": "field"
                        },
                        {
                            "params": [],
                            "type": "mean"
                        }
                    ]
                ],
                "tags": [
                    {
                        "key": "id",
                        "operator": "=",
                        "value": "###GUARANTEE.NAME###"
                    },
                    {
                        "condition": "AND",
                        "key": "scope_class",
                        "operator": "=",
                        "value": "###AGREEMENT.SCOPE.CLASS###"
                    }
                ]
            }
        ],
        "thresholds": [
            {
                "colorMode": "critical",
                "fill": true,
                "line": false,
                "op": "lt",
                "value": "###GUARANTEE.THRESHOLD###",
                "yaxis": "left"
            }
        ],
        "timeFrom": null,
        "timeRegions": [],
        "timeShift": null,
        "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
        },
        "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
        },
        "yaxes": [
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": "100",
                "min": "0",
                "show": true
            },
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": null,
                "min": null,
                "show": true
            }
        ],
        "yaxis": {
            "align": false,
            "alignLevel": null
        }
    },
    "timeGraphPercentNotZero": {
        "title": "###TIME_GRAPH.TITLE###",
        "guarantee": "###GUARANTEE.NAME###",
        "type": "graph",
        "aliasColors": {},
        "bars": false,
        "dashLength": 10,
        "dashes": false,
        "datasource": "InfluxDB",
        "fieldConfig": {
            "defaults": {
                "custom": {},
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                        {
                            "color": "green",
                            "value": null
                        },
                        {
                            "color": "red",
                            "value": 80
                        }
                    ]
                }
            },
            "overrides": []
        },
        "fill": 1,
        "fillGradient": 0,
        "gridPos": {
            "h": 9,
            "w": 20,
            "x": 4,
            "y": 1
        },
        "hiddenSeries": false,
        "id": 4,
        "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
        },
        "lines": true,
        "linewidth": 1,
        "nullPointMode": "connected",
        "options": {
            "dataLinks": []
        },
        "percentage": false,
        "pluginVersion": "7.0.0",
        "pointradius": 2,
        "points": true,
        "renderer": "flot",
        "seriesOverrides": [
            {
                "alias": "Team",
                "color": "#3274D9"
            },
            {
                "alias": "Class mean",
                "color": "rgb(155, 155, 155)",
                "points": false
            }
        ],
        "spaceLength": 10,
        "stack": false,
        "steppedLine": false,
        "targets":
            [
                {
                    "alias": "Team",
                    "groupBy": [],
                    "measurement": "metrics_values",
                    "orderByTime": "ASC",
                    "policy": "autogen",
                    "query": "SELECT \"guaranteeValue\" FROM \"autogen\".\"metrics_values\" WHERE (\"agreement\" = '###AGREEMENT.ID###' AND \"id\" = '###GUARANTEE.NAME###' AND \"###METRIC.NOTZERO###\" != 0) AND $timeFilter",
                    "rawQuery": true,
                    "refId": "A",
                    "resultFormat": "time_series",
                    "select": [
                        [
                            {
                                "params": [
                                    "guaranteeValue"
                                ],
                                "type": "field"
                            }
                        ]
                    ],
                    "tags": []
                },
                {
                    "alias": "Class mean",
                    "groupBy": [],
                    "orderByTime": "ASC",
                    "policy": "autogen",
                    "query": "SELECT MEAN(\"guaranteeValue\") FROM \"autogen\".\"metrics_values\" WHERE (\"scope_class\" = '###AGREEMENT.SCOPE.CLASS###' AND \"id\" = '###GUARANTEE.NAME###' AND \"###METRIC.NOTZERO###\" != 0) AND $timeFilter GROUP BY time(24h)",
                    "rawQuery": true,
                    "refId": "B",
                    "resultFormat": "time_series",
                    "select": [
                        [
                            {
                                "params": [
                                    "value"
                                ],
                                "type": "field"
                            },
                            {
                                "params": [],
                                "type": "mean"
                            }
                        ]
                    ],
                    "tags": []
                }
            ],
        "thresholds": [
            {
                "colorMode": "critical",
                "fill": true,
                "line": false,
                "op": "lt",
                "value": "###GUARANTEE.THRESHOLD###",
                "yaxis": "left"
            }
        ],
        "timeFrom": null,
        "timeRegions": [],
        "timeShift": null,
        "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
        },
        "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
        },
        "yaxes": [
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": "100",
                "min": "0",
                "show": true
            },
            {
                "format": "short",
                "label": null,
                "logBase": 1,
                "max": null,
                "min": null,
                "show": true
            }
        ],
        "yaxis": {
            "align": false,
            "alignLevel": null
        }
    },
    "scatter": {
        "title": "Correlation for all teams",
        "type": "governify-scatterplot",
        "guarantee": "###GUARANTEE.NAME###",
        "datasource": "InfluxDB",
        "description": "",
        "fieldConfig": {
            "defaults": {
                "custom": {}
            },
            "overrides": []
        },
        "gridPos": {
            "h": 9,
            "w": 4,
            "x": 20,
            "y": 1
        },
        "id": 44,
        "options": {
            "axisXmetric": "###METRIC.XAXIS###",
            "axisYmetric": "###METRIC.YAXIS###",
            "groupBy": "scope_project",
            "guaranteeFormula": "x - y = 0",
            "highlightTeam": "###AGREEMENT.PROJECT###",
            "seriesCountSize": "sm",
            "showSeriesCount": false,
            "tooltipText": "Value",
            "threshold": "###GUARANTEE.THRESHOLD###",
            "xAxisTitle": "###METRIC.XAXIS###",
            "yAxisTitle": "###METRIC.YAXIS###"
        },
        "targets": [
            {
                "groupBy": [
                    {
                        "params": [
                            "scope_project"
                        ],
                        "type": "tag"
                    },
                    {
                        "params": [
                            "0"
                        ],
                        "type": "fill"
                    }
                ],
                "measurement": "metrics_values",
                "orderByTime": "ASC",
                "policy": "autogen",
                "refId": "A",
                "resultFormat": "table",
                "select": [
                    [
                        {
                            "params": [
                                "guaranteeValue"
                            ],
                            "type": "field"
                        }
                    ],
                    [
                        {
                            "params": [
                                "###METRIC.XAXIS###"
                            ],
                            "type": "field"
                        }
                    ],
                    [
                        {
                            "params": [
                                "###METRIC.YAXIS###"
                            ],
                            "type": "field"
                        }
                    ]
                ],
                "tags": [
                    {
                        "key": "scope_class",
                        "operator": "=",
                        "value": "###AGREEMENT.SCOPE.CLASS###"
                    },
                    {
                        "condition": "AND",
                        "key": "id",
                        "operator": "=",
                        "value": "###GUARANTEE.NAME###"
                    }
                ]
            }
        ],
        "timeFrom": null,
        "timeShift": null
    },
    "htmlLink": {
        "content": "<script>\n setTimeout(function(){document.getElementById('daySelector').style.filter = 'invert(1)'; document.styleSheets[0].insertRule('::-webkit-calendar-picker-indicator {filter: invert(1);}',1);},1000);\n</script>\n <div style=\"font-size: 34px; color: white; max-width: 90%;text-shadow: 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, .5px .5px #000, -.5px -.5px 0 #000, .5px -.5px 0 #000, -.5px .5px 0 #000;;\">\n<center>\n###TITLE###\n\n</center>\n\n</div>\n<div style=\"font-size: 34px; color: black; margin-top: -60px; max-width: 15%; float: right;  margin-right: 20px;\">\n<button style=\"font-size: 18px; color: #000000\" onclick=\"location.href = location.href.replace('###OLDVIEW###', '###NEWVIEW###')\">\n###BUTTONTEXT###\n</button>\n</div>",
        "gridPos": {
            "h": 2,
            "w": 24,
            "x": 0,
            "y": 0
        },
        "id": 30,
        "mode": "html",
        "type": "text"

    },
    "htmlLinkGithub": {
        "content": "<script>\n setTimeout(function(){document.getElementById('daySelector').style.filter = 'invert(1)'; document.styleSheets[0].insertRule('::-webkit-calendar-picker-indicator {filter: invert(1);}',1);},1000);\n</script>\n <div style=\"padding-left: 19%;font-size: 34px; color: white; max-width: 80%;text-shadow: 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, .5px .5px #000, -.5px -.5px 0 #000, .5px -.5px 0 #000, -.5px .5px 0 #000;;\">\n<center>\n###TITLE###\n\n</center>\n\n</div>\n<div style=\"font-size: 34px; color: black; margin-top: -55px; max-width: 30%; float: right;  margin-right: 10px;\">\n<a href=\"https://www.github.com/%%%GITHUB_SLUG%%%\" target=\"_blank\"><button style=\"font-size: 18px; color: #000000\">\nGitHub Repo\n</button></a>\n<button style=\"font-size: 18px; color: #000000\" onclick=\"location.href = location.href.replace('###OLDVIEW###', '###NEWVIEW###')\">\n###BUTTONTEXT###\n</button>\n</div>",
        "gridPos": {
            "h": 2,
            "w": 24,
            "x": 0,
            "y": 0
        },
        "id": 30,
        "mode": "html",
        "type": "text"
    }
}

function addAtom(atom, width = 24, height = 9, options = {}) {
    const result = { ...atoms[atom] };
    result.gridPos = { ...result.gridPos };
    result.gridPos.w = width;
    result.gridPos.h = height;

    // TODO - Nested objects
    for (const [key, value] of Object.entries(options)) {
        result[key] = value;
    }

    return result;
}

const blocks = {
    "correlated": {
        config: {
            height: 8,
        },
        panels: [
            {
                "collapsed": false,
                "datasource": null,
                "gridPos": {
                    "h": 1,
                    "w": 24,
                    "x": 0,
                    "y": 0
                },
                "id": "###PANEL.ID###",
                "panels": [],
                "title": "###GUARANTEE.DESCRIPTION###",
                "type": "row"
            },
            {
                "title": "Correlation for all teams",
                "datasource": "InfluxDB",
                "description": "",
                "fieldConfig": {
                    "defaults": {
                        "custom": {}
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 10,
                    "w": 6,
                    "x": 0,
                    "y": 1
                },
                "id": 44,
                "options": {
                    "axisXmetric": "###METRIC.XAXIS###",
                    "axisYmetric": "###METRIC.YAXIS###",
                    "groupBy": "scope_project",
                    "guaranteeFormula": "x - y = 0",
                    "highlightTeam": "###AGREEMENT.PROJECT###",
                    "seriesCountSize": "sm",
                    "showSeriesCount": false,
                    "tooltipText": "Value",
                    "xAxisTitle": "###METRIC.XAXIS###",
                    "yAxisTitle": "###METRIC.YAXIS###"
                },
                "targets": [
                    {
                        "groupBy": [
                            {
                                "params": [
                                    "scope_project"
                                ],
                                "type": "tag"
                            },
                            {
                                "params": [
                                    "0"
                                ],
                                "type": "fill"
                            }
                        ],
                        "measurement": "metrics_values",
                        "orderByTime": "ASC",
                        "policy": "autogen",
                        "refId": "A",
                        "resultFormat": "table",
                        "select": [
                            [
                                {
                                    "params": [
                                        "guaranteeValue"
                                    ],
                                    "type": "field"
                                }
                            ],
                            [
                                {
                                    "params": [
                                        "###METRIC.XAXIS###"
                                    ],
                                    "type": "field"
                                }
                            ],
                            [
                                {
                                    "params": [
                                        "###METRIC.YAXIS###"
                                    ],
                                    "type": "field"
                                }
                            ]
                        ],
                        "tags": [
                            {
                                //      "key": "scope_class",
                                //      "operator": "=",
                                //      "value": "###AGREEMENT.SCOPE.CLASS###"
                                //    },
                                //     {
                                //    "condition": "AND",
                                "key": "id",
                                "operator": "=",
                                "value": "###GUARANTEE.NAME###"
                            }
                        ]
                    }
                ],
                "timeFrom": null,
                "timeShift": null,
                "type": "isagroup-scatterplot"
            },
            {
                "title": "Correlation values for all teams",
                "datasource": "InfluxDB",
                "description": "",
                "fieldConfig": {
                    "defaults": {
                        "custom": {
                            "align": null
                        },
                        "mappings": [],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": null
                                },
                                {
                                    "color": "red",
                                    "value": "###GUARANTEE.THRESHOLD###"
                                }
                            ]
                        }
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 10,
                    "w": 8,
                    "x": 6,
                    "y": 1
                },
                "id": 48,
                "options": {
                    "showHeader": true
                },
                "pluginVersion": "7.0.0",
                "targets": [
                    {
                        "groupBy": [
                            {
                                "params": [
                                    "scope_project"
                                ],
                                "type": "tag"
                            }
                        ],
                        "measurement": "metrics_values",
                        "orderByTime": "ASC",
                        "policy": "autogen",
                        "refId": "A",
                        "resultFormat": "table",
                        "select": [
                            [
                                {
                                    "params": [
                                        "###METRIC.XAXIS###"
                                    ],
                                    "type": "field"
                                },
                                {
                                    "params": [],
                                    "type": "sum"
                                }
                            ],
                            [
                                {
                                    "params": [
                                        "###METRIC.YAXIS###"
                                    ],
                                    "type": "field"
                                },
                                {
                                    "params": [],
                                    "type": "sum"
                                }
                            ]
                        ],
                        "tags": [
                            {
                                "key": "id",
                                "operator": "=",
                                "value": "###GUARANTEE.NAME###"
                            }
                        ]
                    }
                ],
                "timeFrom": null,
                "timeShift": null,
                "transformations": [
                    {
                        "id": "organize",
                        "options": {
                            "excludeByName": {
                                "Time": true
                            },
                            "indexByName": {},
                            "renameByName": {
                                "scope_project": "Project",
                                "sum": "Finished stories",
                                "sum_1": "Correlated Pull Requests"
                            }
                        }
                    }
                ],
                "type": "table"
            },
            {
                "title": "Evolution of values through time for this team",
                "aliasColors": {},
                "bars": false,
                "dashLength": 10,
                "dashes": false,
                "datasource": "InfluxDB",
                "fieldConfig": {
                    "defaults": {
                        "custom": {}
                    },
                    "overrides": []
                },
                "fill": 1,
                "fillGradient": 0,
                "gridPos": {
                    "h": 10,
                    "w": 10,
                    "x": 14,
                    "y": 1
                },
                "hiddenSeries": false,
                "id": 46,
                "legend": {
                    "avg": false,
                    "current": false,
                    "max": false,
                    "min": false,
                    "show": true,
                    "total": false,
                    "values": false
                },
                "lines": true,
                "linewidth": 1,
                "nullPointMode": "null",
                "options": {
                    "dataLinks": []
                },
                "percentage": false,
                "pointradius": 2,
                "points": false,
                "renderer": "flot",
                "seriesOverrides": [],
                "spaceLength": 10,
                "stack": false,
                "steppedLine": false,
                "targets": [
                    {
                        "groupBy": [],
                        "measurement": "metrics_values",
                        "orderByTime": "ASC",
                        "policy": "default",
                        "refId": "A",
                        "resultFormat": "table",
                        "select": [
                            [
                                {
                                    "params": [
                                        "###METRIC.XAXIS###"
                                    ],
                                    "type": "field"
                                }
                            ],
                            [
                                {
                                    "params": [
                                        "###METRIC.YAXIS###"
                                    ],
                                    "type": "field"
                                }
                            ]
                        ],
                        "tags": [
                            {
                                "key": "id",
                                "operator": "=",
                                "value": "###GUARANTEE.NAME###"
                            }
                        ]
                    }
                ],
                "thresholds": [],
                "timeFrom": null,
                "timeRegions": [],
                "timeShift": null,
                "tooltip": {
                    "shared": true,
                    "sort": 0,
                    "value_type": "individual"
                },
                "transformations": [
                    {
                        "id": "organize",
                        "options": {
                            "excludeByName": {},
                            "indexByName": {},
                            "renameByName": {
                                "###METRIC.XAXIS###": "Correlated Pull Requests",
                                "###METRIC.YAXIS###": "Finished stories"
                            }
                        }
                    }
                ],
                "type": "graph",
                "xaxis": {
                    "buckets": null,
                    "mode": "time",
                    "name": null,
                    "show": true,
                    "values": []
                },
                "yaxes": [
                    {
                        "format": "short",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                    },
                    {
                        "format": "short",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                    }
                ],
                "yaxis": {
                    "align": false,
                    "alignLevel": null
                }
            }
        ]
    },
    "time-graph": {
        config: {
            height: 8,
        },
        panels: [{
            "datasource": "InfluxDB",
            "fieldConfig": {
                "defaults": {
                    "custom": {
                        "align": "center",
                        "displayMode": "color-background"
                    },
                    "mappings": [],
                    "thresholds": {
                        "mode": "absolute",
                        "steps": [
                            {
                                "color": "rgb(127, 9, 11)",
                                "value": null
                            },
                            {
                                "color": "rgb(30, 104, 11)",
                                "value": "###GUARANTEE.THRESHOLD###"
                            }
                        ]
                    },
                    "unit": "none"
                },
                "overrides": []
            },
            "gridPos": {
                "h": 8,
                "w": 5,
                "x": 19,
                "y": 11
            },
            "id": 4,
            "options": {
                "showHeader": true
            },
            "pluginVersion": "7.0.0",
            "targets": [
                {
                    "groupBy": [],
                    "measurement": "metrics_values",
                    "orderByTime": "ASC",
                    "policy": "autogen",
                    "refId": "A",
                    "resultFormat": "time_series",
                    "select": [
                        [
                            {
                                "params": [
                                    "guaranteeValue"
                                ],
                                "type": "field"
                            }
                        ]
                    ],
                    "tags": [
                        {
                            "key": "agreement",
                            "operator": "=",
                            "value": "###AGREEMENT.ID###"
                        },
                        {
                            "condition": "AND",
                            "key": "id",
                            "operator": "=",
                            "value": "###GUARANTEE.NAME###"
                        }
                    ]
                }
            ],
            "timeFrom": null,
            "timeShift": null,
            "title": "Values in time",
            "type": "table"
        },
        {
            "collapsed": false,
            "datasource": null,
            "gridPos": {
                "h": 1,
                "w": 24,
                "x": 0,
                "y": 19
            },
            "id": 24,
            "panels": [],
            "title": "###GUARANTEE.DESCRIPTION###",
            "type": "row"
        },
        {
            "aliasColors": {},
            "bars": false,
            "dashLength": 10,
            "dashes": false,
            "datasource": "InfluxDB",
            "fieldConfig": {
                "defaults": {
                    "custom": {}
                },
                "overrides": []
            },
            "fill": 1,
            "fillGradient": 0,
            "gridPos": {
                "h": 8,
                "w": 19,
                "x": 0,
                "y": 20
            },
            "hiddenSeries": false,
            "id": 20,
            "legend": {
                "avg": false,
                "current": false,
                "max": false,
                "min": false,
                "show": true,
                "total": false,
                "values": false
            },
            "lines": true,
            "linewidth": 1,
            "nullPointMode": "null",
            "options": {
                "dataLinks": []
            },
            "percentage": false,
            "pointradius": 2,
            "points": true,
            "renderer": "flot",
            "seriesOverrides": [],
            "spaceLength": 10,
            "stack": false,
            "steppedLine": false,
            "targets": [
                {
                    "alias": "",
                    "groupBy": [
                        {
                            "params": [
                                "$__interval"
                            ],
                            "type": "time"
                        },
                        {
                            "params": [
                                "none"
                            ],
                            "type": "fill"
                        }
                    ],
                    "measurement": "metrics_values",
                    "orderByTime": "ASC",
                    "policy": "autogen",
                    "refId": "A",
                    "resultFormat": "time_series",
                    "select": [
                        [
                            {
                                "params": [
                                    "guaranteeValue"
                                ],
                                "type": "field"
                            },
                            {
                                "params": [],
                                "type": "mean"
                            }
                        ]
                    ],
                    "tags": [
                        {
                            "key": "agreement",
                            "operator": "=",
                            "value": "###AGREEMENT.ID###"
                        },
                        {
                            "condition": "AND",
                            "key": "id",
                            "operator": "=",
                            "value": "###GUARANTEE.NAME###"
                        }
                    ]
                }
            ],
            "thresholds": [
                {
                    "colorMode": "critical",
                    "fill": true,
                    "line": false,
                    "op": "lt",
                    "value": "###GUARANTEE.THRESHOLD###",
                    "yaxis": "left"
                }
            ],
            "timeFrom": null,
            "timeRegions": [],
            "timeShift": null,
            "title": "Time Graph",
            "tooltip": {
                "shared": true,
                "sort": 0,
                "value_type": "individual"
            },
            "type": "graph",
            "xaxis": {
                "buckets": null,
                "mode": "time",
                "name": null,
                "show": true,
                "values": []
            },
            "yaxes": [
                {
                    "format": "short",
                    "label": null,
                    "logBase": 1,
                    "max": 100,
                    "min": 0,
                    "show": true
                },
                {
                    "format": "short",
                    "label": null,
                    "logBase": 1,
                    "max": null,
                    "min": null,
                    "show": true
                }
            ],
            "yaxis": {
                "align": false,
                "alignLevel": null
            }
        }]

    },
    "time-graph2": {
        config: {
            height: 8,
        },
        panels: [
            
            addAtom("rowTitle"),
            addAtom("timeGraph")
        ]

    },
    "time-graph2-member": {
        config: {
            height: 8,
        },
        panels: [
            
            addAtom("rowTitle"),
            addAtom("timeGraphMember")
        ]

    },
    "gauge-time-correlation": {
        config: {
            height: 8,
        },
        panels: [
            addAtom("rowTitle"),
            addAtom("gaugeLast5DaysNotZero", 4),
            addAtom("timeGraphPercentNotZero", 14),
            addAtom("scatter", 6),
        ]
    },
    "gauge-time": {
        config: {
            height: 8,
        },
        panels: [
            addAtom("rowTitle"),
            addAtom("gaugeLast5Days", 4),
            addAtom("timeGraphPercent", 20)
        ]
    },
    "gauge": {
        config: {
            height: 9,
            width: 8,
            fillRow: true
        },
        panels: [
            addAtom("gaugeLast5Days", 8, 9, { title: "###GUARANTEE.DESCRIPTION###" })
        ]
    },
    "gauge-not-zero": {
        config: {
            height: 9,
            width: 8,
            fillRow: true
        },
        panels: [
            addAtom("gaugeLast5DaysNotZero", 8, 9, { title: "###GUARANTEE.DESCRIPTION###" })
        ]
    },
    "title-button-view-changer": {
        config: {
            height: 2
        },
        panels: [
            addAtom("htmlLink", 24, 2)
        ]
    },
    "title-button-view-changer-github": {
        config: {
            height: 2
        },
        panels: [
            addAtom("htmlLinkGithub", 24, 2)
        ]
    }
}


function sortBlockCompare(block1, block2) {
    if ((block2.order & !block1.order) || (block1.order > block2.order)) {
        return 1;
    }
    else if ((block1.order & !block2.order) || (block2.order > block1.order)) {
        return -1;
    }
    return 0

}

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function modifyJSON(jsonDashboard, agreement, dashboardName) {
    let modifiedDashboard = { ...jsonDashboard };
    var agreementId = agreement.context.definitions.scopes.development.project.default;
    var dashboardConfig = agreement.context.definitions.dashboards[dashboardName].config;
    var currentXLocation = 0;
    var currentYLocation = 0;
    var currentPanelId = 0;

    //Each block configured in the agreement should be added with its configuration to the dashboard.
    dashboardConfig.blocks.sort(sortBlockCompare).forEach(function (block) {
        var newPanels = [...blocks[block.type].panels];
        //Add here specific block custom code 


        if (block.type === "correlated" || block.type === "gauge-time-correlation") {
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###METRIC.XAXIS###/g, block.config['x-axis-metric']));
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###METRIC.YAXIS###/g, block.config['y-axis-metric']));
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###METRIC.NOTZERO###/g, block.config['not-zero-metric']));
        } else if (block.type === "title-button-view-changer" || block.type === "title-button-view-changer-github") {
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###TITLE###/g, block.config['title']));
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###BUTTONTEXT###/g, block.config['button-text']));
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###OLDVIEW###/g, block.config['old-view']));
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###NEWVIEW###/g, block.config['new-view']));
            if (block.type === "title-button-view-changer-github") {
                var githubSlug = agreementId.split('GH-')[1];
                newPanels = JSON.parse(JSON.stringify(newPanels).replace(/%%%GITHUB_SLUG%%%/g, githubSlug.split('_')[0] + '/' + githubSlug.split('_')[1]));
            }
        } else if (block.type === "gauge-not-zero") {
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###METRIC.NOTZERO###/g, block.config['not-zero-metric']));
        }

        const timeGraphTitle = block.config['time-graph-title'] ? block.config['time-graph-title'] : 'Time Graph';
        newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###TIME_GRAPH.TITLE###/g, timeGraphTitle));

        newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###AGREEMENT.SCOPE.CLASS###/g, agreement.context.definitions.scopes.development.class.default));

        var guarantee = agreement.terms.guarantees.find(gua => {
            return gua.id === block.guarantee
        });

        if (guarantee) {
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###GUARANTEE.DESCRIPTION###/g, guarantee.description));
            newPanels = JSON.parse(JSON.stringify(newPanels).replace(/"###GUARANTEE.THRESHOLD###"/g, guarantee.of[0].objective.split(" ")[guarantee.of[0].objective.split(" ").length - 1]));
        }
        //Add new panels to the current dashboard
        newPanels.forEach(panel => {
            // Increment x position for next block if fill = true
            if (blocks[block.type].config.fillRow) {
                panel.gridPos.x = currentXLocation;
                currentXLocation += blocks[block.type].config.width;
                if (currentXLocation >= 20)
                    currentXLocation = 0;
            } else {
                currentXLocation = 0;
            }

            panel.gridPos.y = currentYLocation;
            panel.id = currentPanelId;
            currentPanelId++;
        });
        currentYLocation += blocks[block.type].config.height;

        newPanels = JSON.parse(JSON.stringify(newPanels).replace(/###GUARANTEE.NAME###/g, block.guarantee));

        modifiedDashboard.panels = modifiedDashboard.panels.concat(newPanels);
        var modifiedDashboardString = JSON.stringify(modifiedDashboard)
        modifiedDashboardString = modifiedDashboardString.replace(/###AGREEMENT.ID###/g, agreement.id)
        if (agreement?.context?.definitions?.scopes?.development?.project?.default) {
            modifiedDashboardString = modifiedDashboardString.replace(/###AGREEMENT.PROJECT###/g, agreement.context.definitions.scopes.development.project.default)
        }

        modifiedDashboard = JSON.parse(modifiedDashboardString);




    });


    //Dashboard JSON is received here, data (like thresholds) must be replaced with agreement data.
    return modifiedDashboard;
}