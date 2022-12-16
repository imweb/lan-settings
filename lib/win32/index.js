const regedit = require('regedit');
const util = require('./util');


const SETTINGS_PATH = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections';
const SETTINGS_KEY = 'DefaultConnectionSettings';


let defaultConnectionSettings;

function getSettings() {
  return new Promise((resolve, reject) => {
    regedit.list(SETTINGS_PATH, (err, result) => {
      if (err) {
        return reject(err);
      }
      result = result && result[SETTINGS_PATH];
      result = result && result.values;
      result = result && result[SETTINGS_KEY];
      resolve(util.parseSettings(result && result.value));
    });
  });
}

function setSettingValue(value) {
  return new Promise((resolve, reject) => {
    const valueToPut = {};
    valueToPut[SETTINGS_PATH] = {};
    valueToPut[SETTINGS_PATH][SETTINGS_KEY] = {
      type: 'REG_BINARY',
      value: util.toRegBinary(value),
    };
    regedit.putValue(valueToPut, (err, result) => {
      if (err) {
        return reject(err);
      }
      // result is undefind
      return resolve(result);
    });
  });
}

async function init() {
  defaultConnectionSettings = await getSettings();
}

module.exports = {
  listNetworkServices: () => {
    throw new Error('listNetworkServices is unsupported on win32 platform!');
  },
  getSettings: async (cb) => {
    if (!defaultConnectionSettings) {
      await init();
    }
    if (typeof cb === 'function') {
      try {
        return cb(null, await getSettings());
      } catch (e) {
        return cb(e, null);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
     */
    return await getSettings();
  },
  setSettings: async (settings, cb) => {
    if (!defaultConnectionSettings) {
      await init();
    }
    if (typeof cb === 'function') {
      try {
        await setSettingValue(settings);
        return cb(null, await getSettings());
      } catch (e) {
        return cb(e, null);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
     */
    await setSettingValue(settings);
    return await getSettings();
  },
  reset: async (cb) => {
    /** get and return default settings */
    if (!defaultConnectionSettings) {
      await init()
      return defaultConnectionSettings;
    }
    if (typeof cb === 'function') {
      try {
        return cb(null, await setSettingValue(defaultConnectionSettings));
      } catch (e) {
        return cb(e, null);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
     */
    return await setSettingValue(defaultConnectionSettings);
  },
};
