
const path = require('path');
const platform = require('os').platform();

/* eslint-disable import/no-dynamic-require */
module.exports = require(path.join(__dirname, platform));
