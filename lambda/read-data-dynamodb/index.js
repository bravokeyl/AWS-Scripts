'use strict';
console.log("Loading the function");

const AWS = require('aws-sdk');
const moment = require('moment');

const docClient = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
  apiVersion: '2012-08-10'
});

const tableName = '60pMW';

exports.handler = function(event,context,cb) {

    console.log(event);

    var a = moment(event.params.querystring.date);
    console.log("Date Query String",event.params.querystring.date);
    var q1 = a.isValid();

    var st,lt;

    if( event.params.querystring.date ) {
      console.log("Date given");
      st = a.utc().valueOf();
      lt = parseInt(st)+ 86400000;
    } else {
      st = moment(moment().format('YYYY-MM-DD')).utc().valueOf();
      lt = parseInt(st)+ 86400000;
    }

    console.log(a.utc().format(),st,"Date",moment(lt).utc().format(),lt);

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
