var path = require('path')
var eos = require('end-of-stream')
var vbm = require('vboxmanage')
var connect = require('./connect')
var debug = require('debug')('autopsy:start')

var SNAPSHOT_NAME = 'init'
var TIME_TILL_GRUB = 3500
var SSH_RETRY_WAIT = 10000

module.exports = function (cb, ready) {
  snapshotExists(SNAPSHOT_NAME, function (err, exists) {
    if (err) return cb && cb(err)

    if (exists) {
      debug('restoring snapshot for fast vm load')
      return loadSnapshot(function (err) {
        if (err) { return cb(err) }
        start(cb, ready)
      })
    }
    debug('no snapshot, entering long boot')
    start(cb, ready, true)
  })
}

function start (cb, ready, createInitialSnapshot) {
  debug('attempting to start smartos vm')
  vbm.instance.start('smartos', function (err) {
    if (err) return cb && cb(err)
    debug('waiting ' + TIME_TILL_GRUB + ' for GRUB loader screen')
    setTimeout(function () {
      // send the return key so we don't wait for grub
      debug('attempting to send <Enter> key press into vm to bypass grub menu')
      vbm.command.exec('controlvm', 'smartos keyboardputscancode 1c 9c'.split(' '), function () {
        cb && cb(null, createInitialSnapshot)
        function check() {
          check.count -= 1
          if (check.count < 1) return
          debug('running a check against ssh connection, remaining attempts: ' + check.count)
          var ssh = connect.ssh()
          eos(ssh, function () {
            debug('failed to connect to ssh retrying in ' + SSH_RETRY_WAIT + 'ms')
            setTimeout(function () {
              check()  
            }, SSH_RETRY_WAIT)
          })
          ssh
            .on('ready', function () {
              if (!createInitialSnapshot) { return ready() }
              debug('first run of vm, creating initialisation snapshot')
              takeSnapshot(ready)
            })
            .on('error', ready)
        }
        check.count = 30
        if (!(ready instanceof Function)) { return }
        check()
      })
    }, TIME_TILL_GRUB)
  })
}


function snapshotExists(name, cb) {
  debug('checking if snapshot exists')
  var args = ['smartos', 'list', '--machinereadable']
  vbm.command.exec('snapshot', args, function (err, code, list) { 
    if (err) { return cb(err) }
    var exists = list.split('\n').some(function (s) {
      return s === 'SnapshotName="' + name + '"'
    })
    debug('snapshot does' + (exists ? '' : ' not') + ' exist')
    cb(null, exists)
  })
}

function takeSnapshot(cb) {
  debug('attempting to take a snapshot')
  var args = ['smartos', 'take', 'init']
  vbm.command.exec('snapshot', args, function (err) {
    debug(err ? 'unable to take snapshot' : 'snapshot successfully taken')
    cb(err)
  })
}

function loadSnapshot(cb) {
  debug('attempting to load snapshot')
  var args = ['smartos', 'restore', SNAPSHOT_NAME]
  vbm.command.exec('snapshot', args, function (err) {
    debug(err ? 'unable to load snapshot' : 'snapshot successfully loaded')
    cb(err)
  })
}