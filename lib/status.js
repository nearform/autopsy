var vbm = require('./vbm')

module.exports = function (cb) {
  vbm.instance.list(function (err, list) {
    if (err) return cb(err)

    cb(null, Object.keys(list).some(function (item) {
      return item === 'smartos'
    }))
  })
}
