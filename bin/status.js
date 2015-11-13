#!/usr/bin/env node

require('../lib/status')(function (err, status) {
  if (err) return console.error(err)
  console.log('vm is ' + (status ? 'up' : 'down'))
})