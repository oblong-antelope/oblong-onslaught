var express = require('express');
var app = express();
var postRequest = require('request');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//25x40 cube is the entire spaceaa

var DATASET = [];
var hSet = new Set();
var MAX_HASH = 800;
var MAX_EPOCH_WAIT = 2;

var EPOCHS_WAITED = 0;

var TOTAL_GROUPS = 500;
var CURRENT_GROUP = 0;

var EPOCH_TIME = 5000;

var ENTIRE_WORLD_SIZE_X = 60;
var ENTIRE_WORLD_SIZE_Y = 100;



app.post('/', function(req, res) {

    updatePrices(req.body.personIdx);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.set('Content-Type', 'text/plain');
    res.send(JSON.stringify({
        datasets: ds
    }));
});

function formDataSets(){
    ds = [];
    var j = 0;

    for(var i=0; i<DATASET.length; i++){
        if(DATASET[i]==null){continue;}

        ds[j] = {
            label: DATASET[i].label,
            data:[{
                x:DATASET[i].x,
                y:DATASET[i].y,
                r:DATASET[i].r,
                idx:DATASET[i].idx
            }],
            backgroundColor:DATASET[i].backgroundColor
        };
        j++;
    }
    return ds;
}



var SERVER_ADDRESS = "https://oblong-adventures.herokuapp.com";
function updatePrices(startIdx) {

    addDataSetGroupByLinkReturnInterest('/api/people/'+startIdx);

    var HASH_ADD_TIMER = setInterval(function(){
        if(hSet.size>MAX_HASH-2 || EPOCHS_WAITED>MAX_EPOCH_WAIT){
            EPOCHS_WAITED = 0;
            addDataSetGroupByHash(generateRandomColour(), Math.random()*ENTIRE_WORLD_SIZE_Y, Math.random()*ENTIRE_WORLD_SIZE_X);
            clearInterval(HASH_ADD_TIMER);
            return formDataSets();
        }
        EPOCHS_WAITED++;
        console.log('hset size is --------------' + hSet.size + ' --- epochs ' + EPOCHS_WAITED);
    }, EPOCH_TIME);
}




function addDataSetGroupByLinkReturnInterest(link){
    postRequest.get(SERVER_ADDRESS + link, function (err, response, body) {
        try {
            var parBody = JSON.parse(body);
            console.log(link);
            var keywords = parBody.keywords;

            for(var keys in keywords){
                getPeopleOfSimilarInterests(keys);
            }
        }catch(e){
            console.log(link + ' failed ' + e);
        }
    });
}

function getPeopleOfSimilarInterests(topicKeyword){
    console.log(topicKeyword);
    postRequest.get(SERVER_ADDRESS + '/api/keywords/' + topicKeyword, function (err, response, body) {
        try {
            var parBody = JSON.parse(body);
            var t = 0;
            while(parBody.profiles[t]!=null && hSet.size<MAX_HASH) {
                hSet.add(parBody.profiles[t].link);
                t++;
            }
        }catch(e){console.log(e);}
    });
}


function addDataSetGroupByHash(dotColor, xOrigin, yOrigin){
    var i = 30*CURRENT_GROUP;
    console.log('at adding pt' + hSet.size);
    hSet.forEach(function(link){
        console.log(link);
        addDataSetGroupWithLink(dotColor, xOrigin, yOrigin, link, i);
        i++;
        hSet.delete(link);
    });
    CURRENT_GROUP++;
}

function generateRandomColour(){
    var col = '#' + Math.floor(Math.random() * 16777215).toString(16);
    while(col.length<7){
        col += 'F';
    }
    return col;
}

function addDataSetGroupWithLink(dotColor, xOrigin, yOrigin, link, i){
    postRequest.get(SERVER_ADDRESS + link, function (err, response, body) {
        try {
            var parBody = JSON.parse(body);
            var name = parBody.name.title + ' ' + parBody.name.first
                + ' ' + parBody.name.initials + ' ' + parBody.name.last;
            var department = parBody.department;
            var label = ' [' + department + '] ' + name;
            DATASET[i] = {
                label: label,
                x: xOrigin + 8*Math.random(),
                y: yOrigin + 8*Math.random(),
                r: 5 * Math.random() + 8,
                backgroundColor: dotColor,
                idx: link
            };
            console.log(i);
        }catch(e){
            console.log(i + ' failed ' + e);
        }
    });
}






var PORT = process.env.PORT || 1140;
var server = app.listen(PORT, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Started Server at %s:%s', host, port);
});