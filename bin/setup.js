#!/usr/bin/env node
var path = require('path')
var fs = require('fs')
var confirm = require('positive')
var download = require('./download')
var remove = require('../lib/remove')
var start = require('./start')
var stop = require('./stop')
var vbm = require('../lib/vbm')

module.exports = function setupCmd() {
  vbm = vbm instanceof Function ? vbm() : vbm
  console.time('SETUP TIME')
  console.log('Setting up smartos vm')

  vbm.machine.list(function fetch(err, list) {
    if (err) return console.error(err)
    var exists = Object.keys(list).some(function (name) {
      return name === 'smartos'
    })

    if (exists && confirm('there is already a smartos vm, would you like to remove it? [Y/n] ')) { 
      return remove(function (err) {
        if (err) return console.error(err)
        setupCmd()
      })
    }

    if (exists) {
      console.error('cannot proceed without removing existing vm')
      process.exit(1)
    }

    download(function (err) {
      if (err) return console.error(err)
      setup(function (err) {
        if (err) return console.error(err)
        console.log('smart os vm has been set up')
        console.timeEnd('SETUP TIME')
        console.log('booting vm to generate snapshot')
        start(function (err) {
          if (err) return console.error(err)
          var keep = confirm('vm ready, keep it running? [Y/n] ')
          
          if (keep) {
            console.log('leaving vm running, stop it any time with autopsy stop')
            process.exit()
          }

          console.log('stopping vm, start it any time with autopsy start')
          process.exit()
        })

      })
    })
  })

  function setup (cb) {
    vbm.machine.import(path.join(__dirname, '../assets/smartos.ovf'), 'smartos', function (err) {
      if (err) return cb(err)
      var args = [
        'smartos',
        '--storagectl', 'IDE Controller',
        '--port', '0',
        '--device', '0',
        '--type', 'dvddrive',
        '--medium', path.join(__dirname, '../assets/smartos.iso')
      ]

      vbm.command.exec('storageattach', args, function (err, code, output) {
        if (err) return cb(err)
        cb()
      })
    })
  }

}

if (!module.parent) { module.exports(process.argv.slice(2)) }
