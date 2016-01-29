#!/usr/bin/env node

var remove = require('../lib/remove')

module.exports = function rmCmd() { 
  remove(function (err) {
    if (err) return console.error(err)
    console.log('vm removed')
  }) 
}

if (!module.parent) { module.exports(process.argv.slice(2)) }