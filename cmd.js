#!/usr/bin/env node

var args = require('commist')()
  .register('ssh', require('./bin/ssh'))
  .register('start', require('./bin/start'))
  .register('stop', require('./bin/stop'))
  .register('setup', require('./bin/setup'))
  .register('remove', require('./bin/remove'))
  .register('status', require('./bin/status'))
  .parse(process.argv.splice(2))

if (args) { require('./bin/mdb')(args) }