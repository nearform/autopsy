var vbm = require('./vbm')
var stop = require('./stop')
var status = require('./status')

module.exports = function (cb) {
  status(function (err, up) { 
    if (err) return cb(err)
    if (!up) return remove(cb)
    stop(function () { remove(cb) })
  })
}

function remove(cb) {
  vbm().machine.remove('smartos', cb)
}