const lan = require('../lib');


const settings = {
  autoDetect: true,
};


lan.setSettings(settings)
  .then(console.log.bind(console, '设置成功'))
  .catch(console.log.bind(console, '设置失败'));
