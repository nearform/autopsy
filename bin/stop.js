#!/usr/bin/env node

require('../lib/stop')(function (err) {
  if (err) return console.error(err)
  console.log('vm stopped')
})
