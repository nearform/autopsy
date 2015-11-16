#!/usr/bin/env node
var path = require('path')
var vbm = require('vboxmanage')
var fs = require('fs')
var download = require('../lib/download')

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

  var assets = 'https://s3-us-west-2.amazonaws.com/autopsy-assets/assets.tar.gz'



  download(assets, function (err) {
    if (err) {
      if (err.message !== download.errors.ASSETS_EXIST) return console.error(err)
      console.warn('Download: ', err.message)
      console.log('Proceeding with setup')
    }
    console.log('...ok')
    setup(function (err) {
      if (err) return console.error(err)
      console.log('SETUP: smart os vm has been set up')
      console.timeEnd('SETUP TIME')
    })
  })

})

function setup (cb) {
  vbm.machine.import(path.join(__dirname, '../assets/smartos.ova'), 'smartos', function (err) {
    if (err) return cb(err)

    //have to copy the file so we still have it, 
    //otherwise the naughty virtual box steals it
    fs.writeFileSync(
      path.join(__dirname, '../assets/smartos-disk1.vmdk'), 
      fs.readFileSync(path.join(__dirname, '../assets/_smartos-disk1.vmdk')))


    var args = [
      'smartos',
      '--storagectl', 'IDE Controller',
      '--port', '0',
      '--device', '0',
      '--type', 'hdd',
      '--medium', path.join(__dirname, '../assets/smartos-disk1.vmdk')
    ]
    vbm.command.exec('storageattach', args, function (err, code, output) {
      if (err) return cb(err)

      var args = [
        'smartos',
        '--storagectl', 'IDE Controller',
        '--port', '1',
        '--device', '0',
        '--type', 'dvddrive',
        '--medium', path.join(__dirname, '../assets/smartos-latest.iso')
      ]

      vbm.command.exec('storageattach', args, function (err, code, output) {
        if (err) return cb(err)
        
        var args = [
          'smartos',
          '--macaddress1', '080027B0011A'
        ]

        vbm.command.exec('modifyvm', args, function (err, code, output) {
          if (err) return cb(err)
          cb()
        })
      })
    })


  })

}
