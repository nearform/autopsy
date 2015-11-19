#!/usr/bin/env node

require('../lib/start')(up, ready)

function up (err) {
  if (err) return console.error(err)
  console.log('vm up, waiting for ready state')
}

function ready (err) {
  if (err) return console.error(err)
  console.log('vm ready')
}
