var lan = require('../lib');

var settings = {
  bypassLocal: true,
  bypass: 'www.test.com;www.test1.com'
};

lan.setSettings(settings, function(err) {
  console.log(err ? '设置失败' : '设置成功');
});
