var fs = require('fs')
var spawn = require('child_process').spawn
var os = require('os')
var path = require('path')
var which = require('which')
var keypress = require('keypress')
var through = require('through2')
var prettyBytes = require('pretty-bytes')
var connect = require('./connect')
var debug = require('debug')('autopsy:mdb')
var log = require('single-line-log').stdout
var banner = fs.readFileSync(path.join(__dirname, '../banner.txt'))
var split = require('split')

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

  if (args.length < 2) {
    if (os.platform() !== 'linux') {
      throw Error('Need both the node binary and core file in that order, e.g: autopsy $(which node) core')
    }
    throw Error('Need at least a core file as argument, e.g. : autopsy core')
  }

  args.forEach(function (f) {
    if (!fs.existsSync(f)) throw Error(f + ' not found!')
  })

  debug('opening connection')
  var ssh = connect.ssh()
  debug('setting stdio to raw mode')
  
  ssh.on('ready', function() {
    debug('ssh is ready')

    debug('cleaning up previous files')
    ssh.exec('rm -fr /root/*', function(err, stream) {
      if (err) { throw err }
      stream.on('close', function(code, signal) {
        if (code) { throw Error(code) }
        debug('successfully cleaned up')
        debug('opening session')
        ssh.shell(function go(err, stream) {
          //support fifos:

          if (fs.statSync(args[0]).isFIFO()) {
            fs.createReadStream(args[0])
              .pipe(fs.createWriteStream('./fifocache.0'))
              .on('finish', function () {
                args[0] = './fifocache.0'
                go(err, stream)
              })
              return
          }

          if (args[1] && fs.statSync(args[1]).isFIFO()) {
            fs.createReadStream(args[1])
              .pipe(fs.createWriteStream('./fifocache.1'))
              .on('finish', function () {
                args[1] = './fifocache.1'
                go(err, stream)
              })
              return
          }

          terminal()
          process.stdin.pipe(stream)

          debug('copying node binary and core dump files')
          copy(args, function (err, args) {
            if (err) { throw err }
            debug('files successfully copied')
            debug('entering mdb shell')

            process.stdin.setRawMode(true)
            keypress(process.stdin)

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
        if (check.count < check.max) {
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
      if (!c) {
        process.stdout.write('\u001b[' + args.length +'A') //move cursor up to first progress bar
        process.stdout.write('\u001b[J') // erase everything beneath
        console.log()
        cb(err, args.map(basename)) 
      }
    }, progress)
  })
}

function progress(file, uploaded, total) {
  file = basename(file)
  progress[file] = render(file, uploaded, total)
  var output = Object.keys(progress)
    .map(function (k) { return progress[k] })
    .join('\n')
  log(output)
}

function render (file, uploaded, total) {
  var output = ''
  var pct = (uploaded / total) * 100
  var bar = Array(Math.floor(42 * pct / 100)).join('=') + '>'
  while (bar.length < 42) bar += ' '
  output +=  file + ' [' + bar + '] ' + pct.toFixed(1) + '%'
  if (total) output += ' of ' + prettyBytes(total)
  return output
}


function relative(f) { return path.relative(process.cwd(), f) }

function basename(f) { return path.basename(f) }

process.on('exit', function () {
  if (fs.existsSync('./fifocache.0')) {
    fs.unlinkSync('./fifocache.0')
  }
  if (fs.existsSync('./fifocache.1')) {
    fs.unlinkSync('./fifocache.1')
  }
})
