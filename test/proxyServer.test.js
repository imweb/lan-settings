const lan = require('../lib');


const settings = {
  proxyEnable: true,
  // proxyServer: '127.0.0.1:8888'
  proxyServer: 'http=127.0.0.1:8888;https=127.0.0.1:8889;ftp=127.0.0.1:8890;socks=127.0.0.1:8891',
};


lan.setSettings(settings)
  .then(console.log.bind(console, '设置成功'))
  .catch(console.log.bind(console, '设置失败'));
