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
