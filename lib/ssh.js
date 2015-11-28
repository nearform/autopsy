var spawn = require('child_process').spawn
var port = 2222
var tunnel = ['-R', port + ':127.0.0.1:' + port]

module.exports = function (args) {
  spawn('ssh', tunnel.concat(args), {stdio: 'inherit'})  
}
