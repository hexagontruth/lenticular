const fs = require('fs');
const pth = require('path');
const util = require('../common/util');

const [readFile, writeFile, copyFile] = util.promisify(fs.readFile, fs.writeFile, fs.copyFile);

function join(...args) {
  return pth.join(__dirname, '..', ...args);
};

Object.assign(util, {
  join, readFile, writeFile, copyFile
});

module.exports = util;
