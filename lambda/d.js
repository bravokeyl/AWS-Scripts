'use strict';
console.log("Loading the function");

function getISTNowMilli() {
  let d = new Date();
  let timestamp = d.getTime();
  const ISTOffset = 330;//in minutes
  let offset = d.getTimezoneOffset();
  let di = timestamp+((offset+ISTOffset)*60*1000);
  return di;
}

function getTodayStartTimeMilli(){
  const ISTMilliDiff = 330*60*1000;

  let d = new Date();
  let offset = d.getTimezoneOffset();

  let diso = d.toISOString().split('-');
  let year = diso[0];
  let month = parseInt(diso[1])-1;
  let di = diso[2];
  let diso2 = di.split('T');
  let day = diso2[0];

  let UTCMilli = Date.UTC(year,month,day,0,0,0);
  let t = UTCMilli - ISTMilliDiff; // Careful here

  return t;
}

console.log(getTodayStartTimeMilli(),"StartTime");
console.log(getISTNowMilli(),"EndTime");

exports.handler = function(event,context,cb) {

    const AWS = require('aws-sdk');

    const docClient = new AWS.DynamoDB.DocumentClient({
      region: 'us-east-1',
      apiVersion: '2012-08-10'
    });

    const tableName = '60pMW';

    var q1 = isNaN(parseInt(event.params.querystring.st)) ? 0 : parseInt(event.params.querystring.st);
    var q2 = isNaN(parseInt(event.params.querystring.lt)) ? 0 : parseInt(event.params.querystring.lt);

    var st,lt;

    if( q1 && q2 ) {
      st = q1;
      lt = q2;
    } else if( q1 ) {
      st = q1;
      lt = getISTNowMilli();
      console.log(st,lt);
    } else {
      st = getTodayStartTimeMilli();
      lt = getISTNowMilli();
    }

    const params = {
          "TableName": tableName,
          "KeyConditionExpression" : '#tid = :id and utime between :st and :lt ',
          "ExpressionAttributeNames" :{
                "#tid": "trackerId"
          },
          "ExpressionAttributeValues": {
              ":id": event.params.path.deviceId,
              ":st": st,
              ":lt": lt
          },
          "ScanIndexForward": false,
          "Limit": 1440
    };

    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to read. Error JSON:", JSON.stringify(err, null, 2));
            cb(null,err);
        } else {
            console.log("Get succeeded:", JSON.stringify(data, null, 2));
            cb(null,data);
        }
  });
};
