#!/usr/bin/env node
var spawn = require('child_process').spawn
var port = 2222
var tunnel = ['-R', port + ':127.0.0.1:' + port]
var debug = require('debug')('autopsy:ssh')

module.exports = function sshCmd(args) {
  debug('spawn: ssh ' + tunnel.concat(args).join(' '))
  spawn('ssh', tunnel.concat(args), {stdio: 'inherit'})
}

if (!module.parent) { module.exports(process.argv.slice(2)) }