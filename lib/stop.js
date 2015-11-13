var vbm = require('vboxmanage')


module.exports = function (cb) {

  vbm.instance.stop('smartos', cb)

}