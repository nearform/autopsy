#!/usr/bin/env node

var start = require('../lib/start')

function up (err, firstBoot) {
  if (err) return console.error(err)
  console.log('vm up, waiting for ready state')
  if (firstBoot) {
    console.log('No snapshot, first boot will take a while (up to 5 mins)')
  }
}

function ready (err) {
  if (err) return console.error(err)
  console.log('vm ready')
  process.exit(0)
}

module.exports = function startCmd(cb) { start(up, cb || ready) }

if (!module.parent) { module.exports(process.argv.slice(2)) }