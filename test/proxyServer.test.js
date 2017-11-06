var lan = require('../lib');

var settings = {
  proxyEnable: true,
  // proxyServer: '127.0.0.1:8888'
  proxyServer: 'http=127.0.0.1:8888;https=127.0.0.1:8889;ftp=127.0.0.1:8890;socks=127.0.0.1:8891'
};

lan.setSettings(settings, function(err) {
  console.log(err ? '设置失败' : '设置成功');
});
