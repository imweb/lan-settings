
const assert = require('assert');
const { parseInfo,
  callNetworkSetup,
  getSettingItems
} = require('./utils');



const proxyTypesMap = {
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


let defaultConnectionSettings;
async function init() {
  defaultConnectionSettings = await getSettings();
}


async function getSettings(networkservice) {
  const settings = {};
  settings['autoDetect'] = (await getSettingItems('getproxyautodiscovery')) === 'On';

  const autoProxy = await getSettingItems('getautoproxyurl', ['URL', 'Enabled']);
  settings['autoConfig'] = autoProxy[1] === 'Yes';
  settings['autoConfigUrl'] = autoProxy[0];

  settings['bypass'] = (await callNetworkSetup('getproxybypassdomains')).replace(/\n/g, ';');

  settings['proxies'] = {};
  settings['proxyEnable'] = false;
  await Promise.all(
    Object.keys(proxyTypesMap).map(async type => {
      const info = parseInfo(await callNetworkSetup(`get${proxyTypesMap[type]}`, networkservice));
      if (info['Enabled'] === 'Yes') {
        const server = info['Server'] + ':' + info['Port'];
        settings['proxies'][`${type}ProxyEnable`] = true;
        settings['proxies'][`${type}ProxyServer`] = server;

        settings['proxyEnable'] = true;
        if (!settings['proxyServer'])
          settings['proxyServer'] = '';
        settings['proxyServer'] += `${type}=${server};`;
      }
      else {
        settings['proxies'][`${type}ProxyEnable`] = false;
      }
    })
  );

  return settings;
}

async function setSettings(settings) {
  !defaultConnectionSettings && await init();

  if ('autoDetect' in settings)
    await callNetworkSetup('setproxyautodiscovery', settings['autoDetect'] ? 'On' : 'Off');
  if ('autoConfig' in settings)
    await callNetworkSetup('setautoproxystate', settings['autoConfig'] ? 'On' : 'Off');
  if ('autoConfigUrl' in settings)
    await callNetworkSetup('setautoproxyurl', settings['autoConfigUrl']);
  if ('bypass' in settings)
    await callNetworkSetup('setproxybypassdomains', settings['bypass'].split(';').join(' '));

  if ('proxyEnable' in settings) {
    if (settings['proxyEnable']) {
      assert('proxyServer' in settings, 'Missing required argument "proxyServer"');
      // 分别设置
      if (settings['proxyServer'].includes('=')) {
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
            await callNetworkSetup(`set${proxyTypesMap[type]}state`, 'On');
            await callNetworkSetup(`set${proxyTypesMap[type]}`, `${address} ${port}`);
          })
        );
      }
      // 统一设置
      else {
        const [address, port] = settings['proxyServer'].split(':');
        await Promise.all(Object.keys(proxyTypesMap)
          .map(async type => {
            await callNetworkSetup(`set${proxyTypesMap[type]}state`, 'Off');
            await callNetworkSetup(`set${proxyTypesMap[type]}`, `${address} ${port}`);
          })
        );
      }
    }
    else {
      await Promise.all(Object.keys(proxyTypesMap)
        .map(type =>
          callNetworkSetup(`set${proxyTypesMap[type]}state`, 'On')
        )
      );
    }
  }
}

async function reset() {
  if (!defaultConnectionSettings) return;
  await setSettings(defaultConnectionSettings);
}



module.exports = {
  getSettings: async (cb) => {
    try {
      return cb(null, await getSettings('Wi-Fi'));
    } catch (e) {
      return cb(e, null);
    }
  },
  setSettings: async (settings, cb) => {
    try {
      await setSettings(settings);
      return cb(null);
    } catch (e) {
      return cb(e);
    }
  },
  reset: async (cb) => {
    try {
      await reset();
      return cb(null);
    } catch (e) {
      return cb(e);
    }
  }
};
