#!/usr/bin/env node
var spawn = require('child_process').spawn
var port = 2222
var args = ['-R', port + ':127.0.0.1:' + port]
spawn('ssh', args.concat(process.argv.slice(2)), {stdio: 'inherit'})