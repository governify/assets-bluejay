console.log("Dashboard Overlay loaded");


function updateGrafanaVariableAndRefresh(variable, value){
    var hash       = {};
    var parser     = document.createElement('a');
    var param = "var-" + variable;

    parser.href    = location.href;

    var parameters = parser.search.split(/\?|&/);

    for(var i=0; i < parameters.length; i++) {
        if(!parameters[i])
            continue;

        var ary      = parameters[i].split('=');
        hash[ary[0]] = ary[1];
    }

    hash[param] = value;

    var list = [];  
    Object.keys(hash).forEach(function (key) {
        list.push(key + '=' + hash[key]);
    });

    parser.search = '?' + list.join('&');
    location.href = parser.href;
}

updateGrafanaVariableAndRefresh("timeFrom", "wad")