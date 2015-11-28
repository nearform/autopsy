var virtualized = require('./in-virtualized-os')()

module.exports = function () {
  if (virtualized) {
    console.error('This is a virtualized environment, can\'t set up a vm in a vm')
    console.error('However we can setup autopsy on our local machine and tunnel through')
    console.error('Checkout the autopsy-ssh command for more info')
    process.exit(1)
  }
  //we musn't require vboxmanage without the above check, this is why it's required here
  //not ideal but ...
  return require('vboxmanage')
}