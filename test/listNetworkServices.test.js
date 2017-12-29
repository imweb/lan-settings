const lan = require('../lib');

lan.listNetworkServices(function(err, services) {
  console.log(err ? '获取失败' : '获取成功');
  console.log(services);
});
