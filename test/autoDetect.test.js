var lan = require('../lib');

var settings = {
  autoDetect: true
};

lan.setSettings(settings, function(err) {
  console.log(err ? '设置失败' : '设置成功');
});
