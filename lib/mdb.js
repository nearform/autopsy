var fs = require('fs')
var spawn = require('child_process').spawn
var os = require('os')
var path = require('path')
var which = require('which')
var keypress = require('keypress')
var through = require('through2')
var connect = require('./connect')
var debug = require('debug')('autopsy:mdb')
var banner = fs.readFileSync(path.join(__dirname, '../banner.txt'))

module.exports = mdb

function mdb(args) {
  if (args.length < 2) {
    if (os.platform() !== 'linux') {
      debug('platform is not linux and less than two args provided, throwing error')
      throw Error('On OSX we need both the linux core file and the exact node binary that generated it (e.g. in the linux environment)')
    }

    debug('less than two args provided so using current node binary as first arg')
    args.unshift(which.sync('node'))
  }
  debug('opening connection')
  var ssh = connect.ssh()
  debug('setting stdio to raw mode')
  process.stdin.setRawMode(true)
  
  ssh.on('ready', function() {
    debug('ssh is ready')
    var dots = Array.apply(null, {length: 20}).map(function () { return '.' })
    
    keypress(process.stdin)

    debug('cleaning up previous files')
    ssh.exec('rm -fr /root/*', function(err, stream) {
      if (err) { throw err }
      stream.on('close', function(code, signal) {
        if (code) { throw Error(code) }
        debug('successfully cleaned up')
        debug('opening session')
        ssh.shell(function (err, stream) {
          terminal()
          process.stdin.pipe(stream)
          debug('copying node binary and core dump files')
          copy(args, function (err, args) {
            if (err) { throw err }
            debug('files successfully copied')
            debug('entering mdb shell')
            stream.write('mdb ' + args.join(' ') + ' # run mdb in tty\n')
            debug('loading v8 mdb debug module')
            stream.write('::load v8\n')
            debug('waiting for token to indicate ready state')
            stream.on('data', function onready(chunk) {
              if (!/demangling/.test(chunk + '')) return
              debug('mdb shell is ready')
              stream.removeListener('data', onready)
              stream.pipe(process.stdout)
              process.stdout.write(banner)
              process.stdout.write('\n')
            })
          })
        })
      })
    })

    function prompt() {
      function check (cb) {
        check.count += 1
        if (dots.length && check.count < check.max) {
          return setTimeout(check, 100, cb)
        }
        cb()
      }
      check.count = 0
      check.max = 100
      check(function () { process.stdout.write('\n> ') })
    }
  })
}

function terminal() {
  var quitting = false
  process.stdin.on('keypress', function (ch, key) {
    if (!key) { 
      if (quitting) { quitting = false }
      return 
    }
    if (key && key.ctrl) {
      if (!quitting && key.name === 'c') {
        process.stdout.write('\n(^C again to quit)')
        quitting = true
        return
      }
      if (key.name === 'c') {
        process.stdout.write('\n')
      }
      if (/c|d/.test(key.name)) {
        process.exit()        
      }
    }
    if (quitting) { quitting = false }
  })
}

function copy (args, cb) {
  args = args.map(relative)
  var c = args.length
  args.forEach(function (f) {
    debug('copying ' + f)
    connect.cp(f, function (err) { 
      if (err) { throw err }
      debug(f + ' was copied into vm')
      c -= 1
      if (!c) { cb(err, args.map(basename)) }
    })
  })
}

function relative(f) { return path.join(process.cwd(), f) }

function basename(f) { return path.basename(f) }
