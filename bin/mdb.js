#!/usr/bin/env node

var mdb = require('../lib/mdb')

module.exports = mdb

if (!module.parent) { module.exports(process.argv.slice(2)) }
