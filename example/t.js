var client = require('scp2')

client.scp('t.js|foo', {
    host: 'localhost',
    username: 'root',
    password: 'root',
    path: '/root',
    port: 2222
}, function (err) {
  console.log(arguments)
})

client.on('connect', () => console.log('connect'))
client.on('ready', () => console.log('ready'))
client.on('error', (err) => console.log('err', err))
client.on('end', () => console.log('end'))
client.on('close', () => console.log('close'))
client.on('mkdir', (dir) => console.log('mkdir', dir))
client.on('write', (object) => console.log('write', object))
client.on('read', (src) => console.log('read', srv))
client.on('transfer', (buffer, uploaded, total) => console.log('transfer', buffer, uploaded, total))
