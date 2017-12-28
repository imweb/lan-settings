
const assert = require('assert');
const { exec } = require('../utils');
const { parseInfo,
  callNetworkSetup,
  getSettingItems
} = require('./utils');



const proxyTypeMap = {
  // 网页代理
  http: 'webproxy',
  // 安全网页代理
  https: 'securewebproxy',
  // FTP 代理
  ftp: 'ftpproxy',
  // Socks5 代理
  socks: 'socksfirewallproxy',
  // 流代理
  stream: 'streamingproxy',
  // Gopher 代理
  gopher: 'gopherproxy'
};

async function getAllSettings(networkservice) {
  const settings = {};
  settings['autoDetect'] = (await getSettingItems('getproxyautodiscovery')) === 'On';

  const autoProxy = await getSettingItems('getautoproxyurl', ['URL', 'Enabled']);
  settings['autoConfig'] = autoProxy[1] === 'Yes';
  settings['autoConfigUrl'] = autoProxy[0];

  settings['bypass'] = (await callNetworkSetup('getproxybypassdomains')).replace(/\n/g, '; ');

  settings['proxyEnable'] = false;
  await Promise.all(
    Object.keys(proxyTypeMap).map(async type => {
      const info = parseInfo(await callNetworkSetup(`get${proxyTypeMap[type]}`, networkservice));
      if (info['Enabled'] === 'Yes') {
        const server = info['Server'] + ':' + info['Port'];
        settings[`${type}ProxyEnable`] = true;
        settings[`${type}ProxyServer`] = server;

        settings['proxyEnable'] = true;
        if (!settings['proxyServer']) settings['proxyServer'] = '';
        settings['proxyServer'] += `${type}=${server};`;
      }
      else {
        settings[`${type}ProxyEnable`] = false;
      }
    })
  );

  return settings;
}


let defaultConnectionSettings;
async function init() {
  defaultConnectionSettings = await getAllSettings();
}


function reset(cb) {

}

async function getSettings(cb) {
  if (!defaultConnectionSettings) await init();
  try {
    const settings = await getAllSettings();
    return cb(null, settings);
  } catch (e) {
    return cb(e, null);
  }
}

async function setSettings(settings, cb) {
  if ('autoDetect' in settings)
    await callNetworkSetup('setproxyautodiscovery', 'Wi-Fi', settings['autoDetect'] ? 'On' : 'Off');
  if ('autoConfig' in settings)
    await callNetworkSetup('setautoproxystate', 'Wi-Fi', settings['autoConfig'] ? 'On' : 'Off');
  if ('autoConfigUrl' in settings)
    await callNetworkSetup('setautoconfigurl', 'Wi-Fi', settings['autoConfigUrl']);
  if ('bypass' in settings)
    await callNetworkSetup('setproxybypassdomains', 'Wi-Fi', settings['bypass']);

  if ('proxyEnable' in settings) {
    assert('proxyServer' in settings, 'Missing required argument "proxyServer"');
    await Promise.all(proxyTypeMap.map(async type =>
      await callNetworkSetup(`set${type}state`, 'Wi-Fi', 'On')
    ));
    await Promise.all(settings['proxyServer']
      .split(';')
      .reduce((servers, item) => {
        // item: [type, address, port]
        const [key, value] = item.split('=').map(s => s.trim());
        servers.push([key].concat(value.split(':')));
        return servers;
      }, [])
      .map(async item => {
        const [type, address, port] = item;
        await callNetworkSetup(`set${type}`, 'Wi-Fi', `${address} ${port}`);
      })
    );
  }
}



module.exports = {
  reset,
  getSettings,
  setSettings
};

