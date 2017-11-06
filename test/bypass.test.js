var lan = require('../lib');

var settings = {
  bypassLocal: true,
  bypass: 'www.test'
};

lan.setSettings(settings, function(err) {
  console.log(err ? '设置失败' : '设置成功');
});
