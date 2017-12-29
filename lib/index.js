
const path = require('path');
const platform = require('os').platform();

const lan = require(path.join(__dirname, platform));


module.exports = lan;
