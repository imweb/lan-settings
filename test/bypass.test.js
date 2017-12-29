const lan = require('../lib');


const settings = {
  bypassLocal: true,
  bypass: 'www.test.com;www.test1.com',
};


lan.setSettings(settings)
  .then(console.log.bind(console, '设置成功'))
  .catch(console.log.bind(console, '设置失败'));
