var spawn = require('child_process').spawn
var confirm = require('positive')
var debug = require('debug')('autopsy:ssh')

var status = require('./status')
var start = require('./start')

var port = 2222
var tunnel = ['-R', port + ':127.0.0.1:' + port]

module.exports = function (args) {
  status(function (err, up) {
    debug('spawn: ssh ' + tunnel.concat(args).join(' '))
    if (err) {
      console.error(err)
      return
    }

    if (up) { return ssh(args) }

    if (!confirm('vm is not up, start vm before SSH? [Y/n] ')) {
      console.warn('it will not be possible to run autopsy over ssh until vm is started...')
      ssh(args)
      return
    }

    console.log('starting vm...')
    start(function () { 
      console.log('vm up, waiting for ready state')
    }, function () {
      console.log('vm ready, entering ssh')
      ssh(args)
    })
    
  })
}


function ssh(args) {
  spawn('ssh', tunnel.concat(args), {stdio: 'inherit'}).on('close', process.exit)
}