const lan = require('../lib');


const settings = {
  autoDetect: true,
  autoConfig: true,
  autoConfigUrl: 'http://127.0.0.1:50011',
  proxyEnable: true,
  proxyServer: '127.0.0.1:8888',
  bypassLocal: true,
  bypass: 'www.test',
};


lan.setSettings(settings)
  .then(() => {
    console.log('设置成功');
    setTimeout(() => {
      lan.reset()
        .then(console.log.bind(console, '重置成功'))
        .catch(console.log.bind(console, '重置失败'));
    }, 1000);
  })
  .catch(console.log.bind(console, '设置失败'));
