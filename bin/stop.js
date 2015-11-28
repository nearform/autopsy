#!/usr/bin/env node

var stop = require('../lib/stop')

module.exports = function stopCmd() { 
  stop(function (err) {
    if (err) return console.error(err)
    console.log('vm stopped')
  }) 
}

if (!module.parent) { module.exports(process.argv.slice(2)) }