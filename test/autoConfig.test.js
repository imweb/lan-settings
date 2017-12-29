const lan = require('../lib');


const settings = {
  autoConfig: true,
  autoConfigUrl: 'http://127.0.0.1:50011',
};


lan.setSettings(settings)
  .then(console.log.bind(console, '设置成功'))
  .catch(console.log.bind(console, '设置失败'));
