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
};

const disableProxyTypesMap = {
  // FTP 代理
  ftp: 'ftpproxy',
  // Socks5 代理
  socks: 'socksfirewallproxy',
  // 流代理
  stream: 'streamingproxy',
  // Gopher 代理
  gopher: 'gopherproxy',
};

const proxyTypes = Object.assign({}, proxyTypesMap, disableProxyTypesMap);

let hadInited = false;
let defaultWiFiSettings;
let defaultEthernetSettings;
let defaultUsbSettings;
let networkServices;


function multiClose(types, networkservice) {
  return Promise.all(Object.keys(types)
    .map(async (type) => {
      await callNetworkSetup(`set${types[type]}state`, 'off', networkservice);
    })
  );
}

async function listNetworkServices() {
  return (await exec('networksetup -listallnetworkservices'))
    .split('\n')
    .filter(i => i.trim() && !i.includes('*'))
    .filter(i => !['Bluetooth PAN', 'Thunderbolt Bridge', 'iPhone USB'].includes(i));
}

async function getSettings(networkservice) {
  if (networkservice === 'All') {
    // 插上网线时, Wi-Fi 不生效, 直接获取 Ethernet 配置
    if (networkServices.includes('Ethernet')) {
      return await getSettings('Ethernet');
    }
    return await getSettings('Wi-Fi');
  }
  const settings = {};
  settings.autoDetect = (await getSettingItems('getproxyautodiscovery', [], networkservice)) === 'On';

  const autoProxy = await getSettingItems('getautoproxyurl', ['URL', 'Enabled'], networkservice);
  settings.autoConfig = autoProxy[1] === 'Yes';
  const autoConfigUrl = autoProxy[0].trim();
  if (autoConfigUrl && autoConfigUrl !== '(null)') {
    settings.autoConfigUrl = autoConfigUrl;
  } else {
    settings.autoConfigUrl = '';
  }

  const bypass = (await callNetworkSetup('getproxybypassdomains', '', networkservice)).trim();
  if (bypass !== `There aren't any bypass domains set on ${networkservice}.`) {
    settings.bypass = bypass.replace(/\n/g, ';');
  }

  settings.proxies = {};
  settings.proxyEnable = false;
  settings.proxyServer = '';
  await Promise.all(
    Object.keys(proxyTypes)
      .map(async (type) => {
        const info = parseInfo(await callNetworkSetup(`get${proxyTypes[type]}`, '', networkservice));
        if (info.Enabled === 'Yes') {
          const server = `${info.Server}:${info.Port}`;
          settings.proxies[`${type}ProxyEnable`] = true;
          settings.proxies[`${type}ProxyServer`] = server;
          settings.proxyEnable = true;
          settings.proxyServer += `${type}=${server};`;
        } else {
          settings.proxies[`${type}ProxyEnable`] = false;
        }
      })
  );

  return settings;
}

async function init() {
  if (!networkServices) {
    networkServices = await listNetworkServices();
  }
  let wifi;
  if (networkServices.includes('Wi-Fi')) {
    wifi = await getSettings('Wi-Fi');
  }
  let ether;
  if (networkServices.includes('Ethernet')) {
    ether = await getSettings('Ethernet');
  }
  let usb;
  let usbName;
  networkServices.forEach((name) => {
    if (name.includes('USB')) {
      usbName = name;
    }
  });
  if (usbName) {
    usb = await getSettings(usbName);
  }
  if (hadInited) {
    return;
  }
  hadInited = true;
  defaultWiFiSettings = wifi;
  defaultEthernetSettings = ether;
  defaultUsbSettings = usb;
}

async function setSettings(settings, networkservice) {
  if (!(defaultWiFiSettings || defaultEthernetSettings || defaultUsbSettings)) {
    await init();
  }
  if (networkservice === 'All') {
    return await Promise.all(networkServices.map(setSettings.bind(null, settings)));
  }

  if ('autoDetect' in settings) {
    await callNetworkSetup(
      'setproxyautodiscovery',
      settings.autoDetect ? 'on' : 'off',
      networkservice
    );
  }
  if (settings.autoConfig) {
    await callNetworkSetup('setautoproxystate', 'on', networkservice);
    if (settings.autoConfigUrl.trim()) {
      await callNetworkSetup(
        'setautoproxyurl',
        settings.autoConfigUrl,
        networkservice
      );
    }
  } else {
    await callNetworkSetup('setautoproxystate', 'off', networkservice);
  }
  if ('bypass' in settings && settings.bypass.trim()) {
    await callNetworkSetup(
      'setproxybypassdomains',
      settings.bypass.split(';').join(' '),
      networkservice
    );
  }
  if (settings.proxyEnable) {
    // 启用
    if (settings.proxyServer.includes('=')) {
      // 分别设置
      await multiClose(proxyTypes, networkservice);
      await Promise.all(settings.proxyServer
        .split(';')
        .filter(s => s.trim())
        .reduce((servers, item) => {
          const [key, value] = item.split('=').map(s => s.trim());
          servers.push([key].concat(value.split(':')));
          return servers;
        }, [])
        .map(async (item) => {
          // item: [type, address, port]
          const [type, address, port] = item;
          await callNetworkSetup(`set${proxyTypes[type]}state`, 'On', networkservice);
          await callNetworkSetup(`set${proxyTypes[type]}`, `${address} ${port}`, networkservice);
        })
      );
    } else {
      // 统一设置
      const [address, port] = settings.proxyServer.split(':');
      await Promise.all(Object.keys(proxyTypesMap)
        .map(async (type) => {
          await callNetworkSetup(`set${proxyTypesMap[type]}state`, 'on', networkservice);
          await callNetworkSetup(`set${proxyTypesMap[type]}`, `${address} ${port}`, networkservice);
        })
      );
      await multiClose(disableProxyTypesMap, networkservice);
    }
  } else if (settings.proxyEnable === false) {
    await Promise.all(Object.keys(proxyTypesMap)
      .map(type =>
        callNetworkSetup(`set${proxyTypesMap[type]}state`, 'off', networkservice)
      )
    );
  }
}

async function reset(networkservice) {
  if (!(defaultWiFiSettings || defaultEthernetSettings || defaultUsbSettings)) {
    await init();
  }
  if (networkservice === 'All') {
    return await Promise.all(networkServices.map(reset));
  }
  let defaultSettings;
  switch (networkservice) {
    case 'Wi-Fi': defaultSettings = defaultWiFiSettings; break;
    case 'Ethernet': defaultSettings = defaultEthernetSettings; break;
    default: {
      if (networkservice.includes('USB')) {
        defaultSettings = defaultUsbSettings;
      }
    }
  }
  if (defaultSettings) {
    return await setSettings(defaultSettings, networkservice);
  }
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
  getSettings: async (cb, networkservice = 'All') => {
    if (!(defaultWiFiSettings || defaultEthernetSettings || defaultUsbSettings)) {
      await init();
    }
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
  setSettings: async (settings, cb, networkservice = 'All') => {
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
  reset: async (cb, networkservice = 'All') => {
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


init();
