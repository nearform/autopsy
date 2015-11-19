var path = require('path')
var Fast = require('fast-download')
var progress = require('progress-stream')
var fs = require('fs')
var zlib = require('zlib')
var tar = require('tar-stream')
var eos = require('end-of-stream')
var pkg = require('../package.json')
var extract = tar.extract()
var assets = path.join(__dirname, '..', 'assets')
module.exports = download

function download (url, cb) {
  clean()
  cb = cb || function (err) { if (err) console.error(err) }

  var partFile = path.join(__dirname, '..', 'assets.' + pkg.version + '.download')

  var assets = [
    'assets/_smartos-disk1.vmdk',
    'assets/smartos-latest.iso',
    'assets/smartos.ovf'
  ]

  var req = new Fast(url, {
    chunksAtOnce: 8,
    destFile: partFile,
    resumeFile: true
  })

  req.on('start', function (res) {
    var pro = progress({
      time: 100,
      length: +res.headers['content-length'],
      transferred: res._options.start,
      drain: true
    })

    res.pipe(pro)

    res.on('error', cb)

    pro.on('progress', function (p) {
      process.stdout.write(
        'Downloading assets: ' +
        (+p.percentage === 100 ? p.percentage : (+p.percentage).toFixed(2)) +
        '%        \n')

      process.stdout.write(Buffer([0x1b, 0x5b, 0x31, 0x41]))
      process.stdout.write(Buffer([0x1b, 0x5b, 0x30, 0x47]))

      if (p.percentage === 100) {
        process.stdout.write('Download Complete              \n')
        console.log('Decompressing...')

        fs.mkdirSync(path.join(__dirname, '..', 'assets'))

        extract.on('entry', function (header, stream, next) {
          if (!~assets.indexOf(header.name)) return next()

          console.log('extracting', header.name)

          stream
            .resume()
            .on('end', next)
            .pipe(fs.createWriteStream(path.join(__dirname, '..', header.name)))
        })

        eos(
          fs.createReadStream(partFile)
            .pipe(zlib.createGunzip())
            .pipe(extract),
          cb
        )
      }
    })
  })
}

function clean () {
  if (!fs.existsSync(assets)) return
  fs.readdirSync(assets)
    .map(function (f) { return path.join(assets, f) })
    .forEach(fs.unlinkSync)
  fs.rmdirSync(assets)
}
