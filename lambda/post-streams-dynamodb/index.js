'use strict';

console.log('Delete Streaming: 60 trackers per MW');

const AWS = require('aws-sdk');
const r = require('request');

const docClient = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
  apiVersion: '2012-08-10'
});

function popuateItems(data,index,del,olddata){
  let itemsArray = [];
  for(let i=index;i<=(index+24);i++) {
    let datum = data[i];
    let oldie = olddata[i];
    let item = {
      PutRequest: {
        Item: datum
      }
    };
    if(del) {
      item = {
        DeleteRequest: {
          Key: oldie
        }
      };
    }
    if(item){
      itemsArray.push(item);
    }
  }
  console.log("Items Array",itemsArray);
  return itemsArray;
}

function getWindSpeed() {
  console.log("Request before:");
  return r('http://api.openweathermap.org/data/2.5/weather?q=Hyderabad,India&appid=8d6a46f92c052d3d104690de8690f3e6', function (error, response, body) {
    console.log("Status Code",response.statusCode);
    if (!error && response.statusCode == 200) {
      console.log(JSON.parse(body));
      var windspeed = JSON.parse(body).wind.speed;
      let params = populateData(windspeed);

      return params;
    } else {
      console.log("Error from request:", error);
    }
  });
}

function populateData(w,index,records,del) {
  let ind = index;
  let data = [];
  let olddata = [];

  for(let i=index;i<=(index+24);i++) {

    data[i] = {
      trackerId: records[i-1].dynamodb.NewImage.trackerId.S,
      utime: parseInt(records[i-1].dynamodb.NewImage.utime.N),
      ISTDateTime: records[i-1].dynamodb.NewImage.ISTDateTime.S,
      UTCDateTime: records[i-1].dynamodb.NewImage.UTCDateTime.S,
      sunAngle: records[i-1].dynamodb.NewImage.sunAngle.S,
      trackerAngle: records[i-1].dynamodb.NewImage.trackerAngle.S,
      temperature: records[i-1].dynamodb.NewImage.temperature.S,
      windspeed: parseFloat(records[i-1].dynamodb.NewImage.windspeed.N).toFixed(2)
    };
    olddata[i] = {
      trackerId: records[i-1].dynamodb.Keys.trackerId.S
    }
  }

  let params = {
    RequestItems: {
       "Stream60pMW": popuateItems(data,ind,del,olddata)
     }
  };

  return params;
}

exports.handler = function(event, context, callback) {
  console.log("Starting the function");
  let params = [];

  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('Successfully processed', event.Records.length);

  r('http://api.openweathermap.org/data/2.5/weather?q=Hyderabad,India&appid=8d6a46f92c052d3d104690de8690f3e6', function (error, response, body) {
    if (!error && response.statusCode == 200) {

      var windspeed = JSON.parse(body).wind.speed;

      let params1 = populateData(windspeed,1,event.Records,false);
      let params2 = populateData(windspeed,26,event.Records,false);

      let params3 = populateData(windspeed,1,event.Records,true);
      let params4 = populateData(windspeed,26,event.Records,true);

      let params = [ params1,params2,params3,params4 ];

      for(let k =0;k<params.length;k++) {
        docClient.batchWrite(params[k],function(err,data){
          if(err){
            console.log(JSON.stringify(err, null, 2));
            callback(err,null);
          }else {
            console.log(data);
            callback(null,data);
          }
        });
      }
    }//endif
    else {
      console.log("Error from request:", error);
    }
  });

}
