#!/usr/bin/env node

var download = require('../lib/download')
var assets = require('../lib/assets-uri')

module.exports = function (args, cb) {
  if (args instanceof Function) { cb = args }
  download(assets, cb)
}

if (!module.parent) { module.exports(process.argv.slice(2)) }
