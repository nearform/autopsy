var virtualized = require('./in-virtualized-os')()

if (virtualized) {
  console.error('This is a virtualized environment, can\'t set up a vm in a vm')
  console.error('However we can setup autopsy on our local machine and tunnel through')
  console.error('Checkout the autopsy-ssh command for more info')
  process.exit(1)
}

module.exports = require('vboxmanage')