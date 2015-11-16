var path = require('path')
var Fast = require('fast-download')
var progress = require('progress-stream')
var fs = require('fs')
var zlib = require('zlib')
var tar = require('tar-stream')
var eos = require('end-of-stream')
var extract = tar.extract()

module.exports = download

download.errors = {
  ASSETS_EXIST: 'Not downloading assets - assets folder already exists'
}

function download(url, cb) {
  cb = cb || function (err){ if (err) console.error(err) }
  if (fs.existsSync(path.join(__dirname, '..', 'assets'))) {
    return cb(Error(download.errors.ASSETS_EXIST))
  }

  var partFile = path.join(__dirname, '..', 'assets.download')

  var assets = [
    'assets/_smartos-disk1.vmdk', 
    'assets/smartos-latest.iso', 
    'assets/smartos.ova'
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
        'Downloading assets: ' 
        + (+p.percentage).toPrecision(3)
        + '%        \n')

      process.stdout.write(Buffer([0x1b, 0x5b, 0x31, 0x41]))
      process.stdout.write(Buffer([0x1b, 0x5b, 0x30, 0x47]))
      
      if (p.percentage === 100) {
        process.stdout.write('Download Complete              \n')
        console.log('Decompressing...')

        fs.mkdirSync(path.join(__dirname, '..', 'assets'))

        extract.on('entry', function(header, stream, next) {
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

