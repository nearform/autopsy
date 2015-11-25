#!/usr/bin/env node

require('../lib/start')(up, ready)

function up (err, firstBoot) {
  if (err) return console.error(err)
  console.log('vm up, waiting for ready state')
  if (firstBoot) {
    console.log('No snapshot, first boot will take a while (up to 5 mins)')
  }
}

function ready (err) {
  if (err) return console.error(err)
  console.log('vm ready')
  process.exit(0)
}
