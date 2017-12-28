
const DEFAULT_SETTINGS = [70, 0, 0, 0, 0, 0, 0, 0];
const SEP = [0, 0, 0];
const MIN_LENGTH = 4;

const PROXY_SERVER_FLAG = 3;
const AUTOCONFIG_FLAG = 5;
const AUTODETECT_FLAG = 9;

exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;

function parseFlags(result, flags) {
  result.autoDetect = (flags & AUTODETECT_FLAG) === AUTODETECT_FLAG;
  result.autoConfig = (flags & AUTOCONFIG_FLAG) === AUTOCONFIG_FLAG;
  result.proxyEnable = (flags & PROXY_SERVER_FLAG) === PROXY_SERVER_FLAG;
}

function parseValue(value, isList) {
  if (!value || !value.length) {
    return '';
  }
  value = new Buffer(value).toString();
  value = value.replace(/\s+/g, '');
  if (!value || !isList) {
    return value;
  }
  return value.toLowerCase().split(';');
}

function parseBypass(result, bypass) {
  bypass = parseValue(bypass, true);
  var index = bypass.indexOf('<local>');
  if (index !== -1) {
    bypass.splice(index, 1);
    result.bypassLocal = true;
    result.bypass = bypass.join(';');
  }
  return result;
}

exports.parseSettings = function(value) {
  value = Array.isArray(value) ? value.slice(DEFAULT_SETTINGS.length) : null;
  var result = {
    autoDetect: false,
    autoConfig: false,
    autoConfigUrl: '',
    proxyEnable: false,
    proxyServer: '',
    bypassLocal: false,
    bypass: ''
  };
  if (!value || !value.length) {
    return result;
  }
  parseFlags(result, value[0]);
  value = value.slice(MIN_LENGTH);
  if (value.length <= MIN_LENGTH) {
    return result;
  }

  var end = MIN_LENGTH + value[0];
  result.proxyServer = parseValue(value.slice(MIN_LENGTH, end));
  value = value.slice(end);
  if (value.length <= MIN_LENGTH) {
    return result;
  }

  end = MIN_LENGTH + value[0];
  parseBypass(result, value.slice(MIN_LENGTH, end));
  value = value.slice(end);
  if (value.length <= MIN_LENGTH) {
    return result;
  }
  end = MIN_LENGTH + value[0];
  result.autoConfigUrl = parseValue(value.slice(MIN_LENGTH, end));
  return result;
};

function toBinaryArray(value) {
  var result = [0].concat(SEP);
  if (value && typeof value === 'string') {
    value = new Buffer(value);
    var len = value.length;
    if (len > 255) {
      len = 255;
      value = value.slice(0, 255);
    }
    result[0] = len;
    result.push.apply(result, value);
  }
  return result;
}

exports.toRegBiary = function(settings) {
  if (!settings) {
    return DEFAULT_SETTINGS;
  }
  var flags = 0;
  if (settings.autoDetect) {
    flags |= AUTODETECT_FLAG;
  }
  if (settings.autoConfig) {
    flags |= AUTOCONFIG_FLAG;
  }
  if (settings.proxyEnable) {
    flags |= PROXY_SERVER_FLAG;
  }
  var result = DEFAULT_SETTINGS.concat([flags]).concat(SEP);
  var bypass = String(settings.bypass || '');
  if (settings.bypassLocal) {
    bypass += ';<local>';
  }
  result = result.concat(toBinaryArray(settings.proxyServer));
  result = result.concat(toBinaryArray(bypass));
  return result.concat(toBinaryArray(settings.autoConfigUrl));
};
