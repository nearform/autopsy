#!/usr/bin/env node

var status = require('../lib/status')

module.exports = function statusCmd() { 
  status(function (err, status) {
    if (err) return console.error(err)
    console.log('vm is ' + (status ? 'up' : 'down'))
  })
}

if (!module.parent) { module.exports(process.argv.slice(2)) }