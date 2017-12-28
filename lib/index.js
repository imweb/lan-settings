
const path = require('path');
const platform = require('os').platform();


module.exports = require(path.join(__dirname, platform));
