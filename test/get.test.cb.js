const lan = require('../lib');


lan.getSettings((err, settings) => {
  if (err) {
    console.log('获取失败');
  } else {
    console.log(settings);
  }
  // output:
  // { autoDetect: false,
  //   autoConfig: false,
  //   autoConfigUrl: '',
  //   proxyEnable: true,
  //   proxyServer: '127.0.0.1:8888',
  //   bypassLocal: false,
  //   bypass: '' }
});
