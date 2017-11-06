var lan = require('../lib');

var settings = {
  autoConfig: true,
  autoConfigUrl: 'http://127.0.0.1:50011'
};

lan.setSettings(settings, function(err) {
  console.log(err ? '设置失败' : '设置成功');
});
