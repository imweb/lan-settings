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


lan.setSettings(settings, (err) => {
  if (err) {
    console.log('设置失败');
  } else {
    console.log('设置成功');
    setTimeout(() => {
      lan.reset((e) => {
        console.log(e ? '重置失败' : '重置成功');
      });
    }, 1000);
  }
});
