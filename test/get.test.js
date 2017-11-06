var lan = require('../lib');

lan.getSettings(function(err, settings) {
  console.log(settings);
  // output:
  // { autoDetect: false,
  //   autoConfig: false,
  //   autoConfigUrl: '',
  //   proxyEnable: true,
  //   proxyServer: '127.0.0.1:8888',
  //   bypassLocal: false,
  //   bypass: '' }
});
