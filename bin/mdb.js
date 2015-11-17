#!/usr/bin/env node

var os = require('os')
var path = require('path')
var which = require('which')

var through = require('through2')
var split = require('split')
var spawn = require('child_process').spawn

prepare(process.argv.slice(2), function (err, args) {
  if (err) return console.error(err)
  var mdb = spawn('expect', [path.join(__dirname, '../scripts/mdb')].concat(args))
  var lastInput 

  process.stdin
    .pipe(through(function (data, enc, cb) {
      lastInput = data

      if (data.length === 1 && data[0] === 10)
          process.stdout.write('> ')
        
      cb(null, data)
    }))
    .pipe(mdb.stdin)


  mdb.stdout
    .pipe(split())
    .pipe(through(function (data, enc, cb) {
      if (compare(data, lastInput)) return cb()
      if (!ready(data)) return cb()

      cb(null, data)
      process.stdout.write('\n> ')
    }))
    .pipe(process.stdout)

  function ready(data) {
    if (ready.rx.test(data+'')) {
      ready.now = true
      mdb.stdin.write('::load /mdb/mdb_v8.so\n')
    }
    
    return ready.now
  }
  ready.rx = /\[root@.+ ~\]# zlogin 7f3ba160-047c-4557-9e87-8157db23f205 mdb/


})



function compare(a, b) {
  return (a+'').replace(/\n|\r/g,'').replace(/ /,'') === (b+'').replace(/\n|\r/g,'').replace(/ /,'')
}


function prepare(args, cb) {
  if (args.length < 2) {
    if (os.platform() !== 'linux') {
      throw Error('On OSX we need both the linux core file and the exact node binary that generated it (e.g. in the linux environment)')
    }
    //for convenience on linux, we'll assume the current 
    //installed node binary
    args.unshift(which.sync(node))
  }

  spawn('expect', [path.join(__dirname, '../scripts/clean')])
    .on('close', function () {
      spawn('expect', [path.join(__dirname, '../scripts/cp')].concat(args))
        .on('close', function () {
          cb(null, args.map(function (f) { return path.basename(f) }))
        })
        .on('error', cb)  
    })
    .on('error', cb)

}



