var lan = require('../lib');

var settings = {
  autoDetect: true,
  autoConfig: true,
  autoConfigUrl: 'http://127.0.0.1:50011',
  proxyEnable: true,
  proxyServer: '127.0.0.1:8888',
  bypassLocal: true,
  bypass: 'www.test'
};

lan.setSettings(settings, function(err) {
  console.log(err ? '设置失败' : '设置成功');
});
