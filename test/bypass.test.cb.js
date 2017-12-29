const lan = require('../lib');


const settings = {
  bypassLocal: true,
  bypass: 'www.test.com;www.test1.com',
};


lan.setSettings(settings, (err) => {
  console.log(err ? '设置失败' : '设置成功');
});
