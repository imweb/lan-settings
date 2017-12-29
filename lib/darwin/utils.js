
const {exec} = require('../utils');


function parseInfo(data) {
  return data
    .split('\n')
    .map(i => i.split(': '))
    .reduce((info, item) => {
      if (item.length < 2) return info;
      const [key, value] = item.map(i => i.trim().replace(/\s+/g, '-'));
      info[key] = value;
      return info;
    }, {});
}

function callNetworkSetup(type, args, networkservice) {
  return exec(`networksetup -${type} ${networkservice} ${args}`);
}

async function getSettingItems(arg, keys, networkservice) {
  const info = parseInfo(await callNetworkSetup(arg, '', networkservice));
  if (!keys || keys.length === 0) return info[Object.keys(info)[0]];
  if (typeof keys === 'string') return info[keys];

  if (keys.length === 1) return info[keys[0]];
  return keys.map(key => info[key]);
}


module.exports = {
  parseInfo,
  callNetworkSetup,
  getSettingItems
};
