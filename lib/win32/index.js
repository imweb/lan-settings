const regedit = require('regedit');
const util = require('./util');


const SETTINGS_PATH = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections';
const SETTINGS_KEY = 'DefaultConnectionSettings';


let defaultConnectionSettings;

async function init() {
  defaultConnectionSettings = await getSettings();
}


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
      value: util.toRegBiary(value),
    };
    regedit.putValue(valueToPut, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}


module.exports = {
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
        return cb(null, await setSettingValue(settings));
      } catch (e) {
        return cb(e, null);
      }
    }
    /**
     * 不传入 callback, 使用 Promise
     */
    return await setSettingValue(settings);
  },
  reset: async (cb) => {
    if (!defaultConnectionSettings) {
      return;
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
