var pci = require('proc-cpuinfo')()

//only detects virtualized *Linux* environment (using /proc/cpuinfo)
module.exports = function () {
  return pci.flags && pci.flags.indexOf('hypervisor') > -1
}

