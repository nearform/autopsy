var client = require('scp2')
var connect = require('ssh-connect-prompt')
var debug = require('debug')('autopsy:connect')

var addr =  {
  host: 'localhost',
  username: 'root',
  password: 'root',
  path: '/root',
  port: 2222
}

function cp(path, cb) { 
  debug('scp copying ' + path + ' into vm at /root')
  client.scp(path, addr, cb) 
}

function ssh() {
  debug('creating connection to ssh root@localhost:2222')
  return connect('root@localhost:2222', {
    password: 'root',
    verify: false,
    interactive: false
  })
}

module.exports = {
  cp: cp,
  ssh: ssh
}
