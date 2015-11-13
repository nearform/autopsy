var path = require('path')
var vbm = require('vboxmanage')
var spawn = require('child_process').spawn

module.exports = function (cb, ready) {

  vbm.instance.start('smartos', function (err) {
    if (err) return cb && cb(err)


    setTimeout(function () {
      //send the return key so we don't wait for grub
      vbm.command.exec('controlvm', 'smartos keyboardputscancode 1c 9c'.split(' '), function () {
      cb && cb()


      function check () {
        spawn('expect', [
          path.join(__dirname, '../scripts/check')
        ]).on('close', function (code) {
            if (!code) return ready()
            if (code === 255) {
              return setTimeout(check, 1000)
            }
            ready(Error('scripts/check got code ' + code))
          })
          .on('error', ready)
      }

      if (!(ready instanceof Function)) return
      check()
      

      })    
    }, 3500)


  })

}