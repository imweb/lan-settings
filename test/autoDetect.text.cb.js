const lan = require('../lib');


const settings = {
  autoDetect: true,
};


lan.setSettings(settings, (err) => {
  console.log(err ? '设置失败' : '设置成功');
});
