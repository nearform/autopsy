#!/usr/bin/env node

var virtualized = require('../lib/in-virtualized-os')()

if (virtualized) {
  console.error('This is a virtualized environment, can\'t set up a vm in a vm')
  console.error('However we can setup autopsy on our local machine and tunnel through')
  console.error('Checkout the autopsy-ssh command for more info')
  process.exit(1)
}

var path = require('path')
var vbm = require('vboxmanage')
var fs = require('fs')
var download = require('../lib/download')
var assets = require('../lib/assets-uri')

console.time('SETUP TIME')
console.log('SETUP: Setting up smartos vm')

vbm.machine.list(function (err, list) {
  if (err) return console.error(err)
  var exists = Object.keys(list).some(function (name) {
    return name === 'smartos'
  })

  if (exists) {
    console.warn('SETUP: there is already a smartos vm')
    console.warn('SETUP: exiting gracefully')
    console.warn('')
    return
  }

  download(assets, function (err) {
    if (err) return console.error(err)
    setup(function (err) {
      if (err) return console.error(err)
      console.log('SETUP: smart os vm has been set up')
      console.timeEnd('SETUP TIME')
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

      // var args = [
      //   'smartos',
      //   '--macaddress1', '080027B0011A'
      // ]

      // vbm.command.exec('modifyvm', args, function (err, code, output) {
      //   if (err) return cb(err)
        cb()
      // })
    })
  })
}
