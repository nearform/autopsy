var ScpClient = require('scp2').Client
var connect = require('ssh-connect-prompt')
var debug = require('debug')('autopsy:connect')

function scp() {
  return new ScpClient({
    host: 'localhost',
    username: 'root',
    password: 'root',
    port: 2222
  })
}

function cp(path, cb, progress) { 
  debug('scp copying ' + path + ' into vm at /root')
  var client = scp()
  client.upload(path, '/root', function (err) {
    progress(path, cp[path], cp[path])
    cp[path] = null
    cb(err)
  }) 
  client.on('transfer', function (buffer, uploaded, total) {
    if (!cp[path]) { cp[path] = total }
    progress(path, uploaded, total)
  })
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
