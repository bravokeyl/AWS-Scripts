'use strict';

console.log('60 trackers per MW');

const AWS = require('aws-sdk');
const r = require('request');
const moment = require('moment');

const docClient = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
  apiVersion: '2012-08-10'
});

function popuateItems(data,index){
  let itemsArray = [];
  for(let i=index;i<=(index+24);i++) {
    let datum = data[i];
    let item = {
      PutRequest: {
        Item: datum
      }
    };
    if(item){
      itemsArray.push(item);
    }
  }
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

function populateData(w,index) {
  let ind = index;
  let data = [];

  var sa = parseFloat(Math.random() * 90).toFixed(4);
  var ta = parseFloat(sa - (Math.random() * 3) +2).toFixed(4);

  var IST = moment().utcOffset("+05:30").format();

  for(let i=index;i<=(index+24);i++) {
    data[i] = {
      trackerId: 'NGT-AZP-Q4-0'+i,
      utime: Date.now(),
      ISTDateTime: IST,
      UTCDateTime: moment().utc().format(),
      sunAngle: sa,
      trackerAngle: ta,
      temperature: parseFloat(Math.random() * 24 + 14).toFixed(4),
      windspeed: w
    }
  }

  let params = {
    RequestItems: {
       "60pMW": popuateItems(data,ind)
     }
  };

  return params;
}

exports.handler = function(event, context, callback) {
  console.log("Starting the function");
  let params = [];

  r('http://api.openweathermap.org/data/2.5/weather?q=Hyderabad,India&appid=8d6a46f92c052d3d104690de8690f3e6', function (error, response, body) {
    console.log("Status Code",response.statusCode);
    if (!error && response.statusCode == 200) {
      console.log("Success request");
      console.log("Response JSON",JSON.parse(body));
      var windspeed = JSON.parse(body).wind.speed;

      let params1 = populateData(windspeed,1);
      let params2 = populateData(windspeed,26);

      let params = [ params1,params2 ];

      for(let k =0;k<params.length;k++) {
        docClient.batchWrite(params[k],function(err,data){
          if(err){
            console.log(JSON.stringify(err, null, 2));
            callback(err,null)
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
