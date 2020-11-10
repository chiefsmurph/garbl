const { promisify } = require('util');
const ffmetadata = require("ffmetadata");

module.exports = {
    read: promisify(ffmetadata.read),
    write: promisify(ffmetadata.write),
};