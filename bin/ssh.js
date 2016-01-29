#!/usr/bin/env node
var ssh = require('../lib/ssh')

module.exports = ssh

if (!module.parent) { module.exports(process.argv.slice(2)) }