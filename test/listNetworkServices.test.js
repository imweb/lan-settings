const lan = require('../lib');


lan.listNetworkServices()
  .then(console.log.bind(console, '获取成功'))
  .catch(console.log.bind(console, '获取失败'));
