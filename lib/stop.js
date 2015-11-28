var vbm = require('./vbm')

module.exports = function (cb) {
  vbm().instance.stop('smartos', cb)
}
