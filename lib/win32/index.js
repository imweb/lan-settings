var regedit = require('regedit');
var util = require('./util');

var SETTINGS_PATH = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections';
var SETTINGS_KEY = 'DefaultConnectionSettings';
var initCallbacks = [];
var defaultConnectionSettings;
var parsedConnectionSettings;

function getSettingsValue(cb) {
  regedit.list(SETTINGS_PATH, function(err, result) {
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
  var valueToPut = {};
  valueToPut[SETTINGS_PATH] = {};
  valueToPut[SETTINGS_PATH][SETTINGS_KEY] = {
    type: 'REG_BINARY',
    value: value
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
  getSettingsValue(function(err, value) {
    if (!err) {
      parsedConnectionSettings = util.parseSettings(value);
      defaultConnectionSettings = value || util.DEFAULT_SETTINGS;
    }
    initCallbacks.forEach(function(cb) {
      cb(err, parsedConnectionSettings);
    });
    initCallbacks = [];
  });
}

exports.reset = function(cb) {
  if (!defaultConnectionSettings) {
    return;
  }
  initDefaultConnectionSettings(function(err) {
    if (err) {
      return cb(err);
    }
    setSettingValue(defaultConnectionSettings, cb);
  });
};

exports.getSettings = function(cb) {
  if (!parsedConnectionSettings) {
    return initDefaultConnectionSettings(cb);
  }
  getSettingsValue(function(err, value) {
    cb(err, util.parseSettings(value));
  });
};

exports.setSettings = function(settings, cb) {
  initDefaultConnectionSettings(function(err) {
    if (err) {
      return cb(err);
    }
    settings = util.toRegBiary(settings);
    setSettingValue(settings, cb);
  });
};
