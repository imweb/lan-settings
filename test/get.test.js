const lan = require('../lib');


lan.getSettings()
  .then(console.log.bind(console))
  .catch(console.log.bind(console, '获取失败'));
