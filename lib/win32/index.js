const regedit = require('regedit');
const util = require('./util');

const SETTINGS_PATH = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections';
const SETTINGS_KEY = 'DefaultConnectionSettings';
let initCallbacks = [];
let defaultConnectionSettings;
let parsedConnectionSettings;

function getSettingsValue(cb) {
  regedit.list(SETTINGS_PATH, (err, result) => {
    if (err) {
      return cb(err);
    }
    result = result && result[SETTINGS_PATH];
    result = result && result.values;
    result = result && result[SETTINGS_KEY];
    cb(err, result && result.value);
  });
}

function setSettingValue(value, cb) {
  const valueToPut = {};
  valueToPut[SETTINGS_PATH] = {};
  valueToPut[SETTINGS_PATH][SETTINGS_KEY] = {
    type: 'REG_BINARY',
    value,
  };
  regedit.putValue(valueToPut, cb);
}

function initDefaultConnectionSettings(cb) {
  if (parsedConnectionSettings) {
    return cb(null, parsedConnectionSettings);
  }
  initCallbacks.push(cb);
  if (initCallbacks.length > 1) {
    return;
  }
  getSettingsValue((err, value) => {
    if (!err) {
      parsedConnectionSettings = util.parseSettings(value);
      defaultConnectionSettings = value || util.DEFAULT_SETTINGS;
    }
    initCallbacks.forEach((cb) => {
      cb(err, parsedConnectionSettings);
    });
    initCallbacks = [];
  });
}

exports.reset = function (cb) {
  if (!defaultConnectionSettings) {
    return;
  }
  initDefaultConnectionSettings((err) => {
    if (err) {
      return cb(err);
    }
    setSettingValue(defaultConnectionSettings, cb);
  });
};

exports.getSettings = function (cb) {
  if (!parsedConnectionSettings) {
    return initDefaultConnectionSettings(cb);
  }
  getSettingsValue((err, value) => {
    cb(err, util.parseSettings(value));
  });
};

exports.setSettings = function (settings, cb) {
  initDefaultConnectionSettings((err) => {
    if (err) {
      return cb(err);
    }
    settings = util.toRegBiary(settings);
    setSettingValue(settings, cb);
  });
};
