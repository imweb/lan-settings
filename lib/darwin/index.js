const assert = require('assert');
const { exec } = require('../utils');
const {
  parseInfo,
  callNetworkSetup,
  getSettingItems,
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
  gopher: 'gopherproxy',
};


let defaultConnectionSettings;

async function init(networkservice) {
  defaultConnectionSettings = await getSettings(networkservice);
}


async function listNetworkServices() {
  return (await exec('networksetup -listallnetworkservices'))
    .split('\n')
    .filter(i => i.trim() && !i.includes('*'));
}

async function getSettings(networkservice) {
  const settings = {};
  settings.autoDetect = (await getSettingItems('getproxyautodiscovery', [], networkservice)) === 'On';

  const autoProxy = await getSettingItems('getautoproxyurl', ['URL', 'Enabled'], networkservice);
  settings.autoConfig = autoProxy[1] === 'Yes';
  settings.autoConfigUrl = autoProxy[0];

  settings.bypass = (await callNetworkSetup('getproxybypassdomains', '', networkservice)).replace(/\n/g, ';');

  settings.proxies = {};
  settings.proxyEnable = false;
  await Promise.all(
    Object.keys(proxyTypesMap).map(async (type) => {
      const info = parseInfo(await callNetworkSetup(`get${proxyTypesMap[type]}`, '', networkservice));
      if (info.Enabled === 'Yes') {
        const server = `${info.Server}:${info.Port}`;
        settings.proxies[`${type}ProxyEnable`] = true;
        settings.proxies[`${type}ProxyServer`] = server;

        settings.proxyEnable = true;
        if (!settings.proxyServer) {
          settings.proxyServer = '';
        }
        settings.proxyServer += `${type}=${server};`;
      } else {
        settings.proxies[`${type}ProxyEnable`] = false;
      }
    })
  );

  return settings;
}

async function setSettings(settings, networkservice) {
  if (!defaultConnectionSettings) {
    await init(networkservice);
  }

  if ('autoDetect' in settings) {
    await callNetworkSetup(
      'setproxyautodiscovery',
      settings.autoDetect ? 'On' : 'Off',
      networkservice
    );
  }
  if ('autoConfig' in settings) {
    await callNetworkSetup(
      'setautoproxystate',
      settings.autoConfig ? 'On' : 'Off',
      networkservice
    );
  }
  if ('autoConfigUrl' in settings) {
    await callNetworkSetup(
      'setautoproxyurl',
      settings.autoConfigUrl,
      networkservice
    );
  }
  if ('bypass' in settings) {
    await callNetworkSetup(
      'setproxybypassdomains',
      settings.bypass.split(';').join(' '),
      networkservice
    );
  }

  if ('proxyEnable' in settings) {
    if (settings.proxyEnable) {
      assert('proxyServer' in settings, 'Missing required argument "proxyServer"');
      if (settings.proxyServer.includes('=')) {
        // 分别设置
        await Promise.all(settings.proxyServer
          .split(';')
          .reduce((servers, item) => {
            // item: [type, address, port]
            const [key, value] = item.split('=').map(s => s.trim());
            servers.push([key].concat(value.split(':')));
            return servers;
          }, [])
          .map(async (item) => {
            const [type, address, port] = item;
            await callNetworkSetup(`set${proxyTypesMap[type]}state`, 'On', networkservice);
            await callNetworkSetup(`set${proxyTypesMap[type]}`, `${address} ${port}`, networkservice);
          })
        );
      } else {
        // 统一设置
        const [address, port] = settings.proxyServer.split(':');
        await Promise.all(Object.keys(proxyTypesMap)
          .map(async (type) => {
            await callNetworkSetup(`set${proxyTypesMap[type]}state`, 'Off', networkservice);
            await callNetworkSetup(`set${proxyTypesMap[type]}`, `${address} ${port}`, networkservice);
          })
        );
      }
    } else {
      await Promise.all(Object.keys(proxyTypesMap)
        .map(type =>
          callNetworkSetup(`set${proxyTypesMap[type]}state`, 'Off', networkservice)
        )
      );
    }
  }
}

async function reset(networkservice) {
  if (!defaultConnectionSettings) {
    return;
  }
  await setSettings(defaultConnectionSettings, networkservice);
}


module.exports = {
  listNetworkServices: async (cb) => {
    if (typeof cb === 'function') {
      try {
        return cb(null, await listNetworkServices());
      } catch (e) {
        return cb(e, null);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
     */
    return await listNetworkServices();
  },
  getSettings: async (cb, networkservice = 'Wi-Fi') => {
    if (typeof cb === 'function') {
      try {
        return cb(null, await getSettings(networkservice));
      } catch (e) {
        return cb(e, null);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
     */
    networkservice = typeof cb === 'string' ? cb : networkservice;
    return await getSettings(networkservice);
  },
  setSettings: async (settings, cb, networkservice = 'Wi-Fi') => {
    if (typeof cb === 'function') {
      try {
        await setSettings(settings, networkservice);
        return cb(null);
      } catch (e) {
        return cb(e);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
     */
    networkservice = typeof cb === 'string' ? cb : networkservice;
    return await setSettings(settings, networkservice);
  },
  reset: async (cb, networkservice = 'Wi-Fi') => {
    if (typeof cb === 'function') {
      try {
        await reset(networkservice);
        return cb(null);
      } catch (e) {
        return cb(e);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
    */
    networkservice = typeof cb === 'string' ? cb : networkservice;
    return await reset(networkservice);
  },
};
