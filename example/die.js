var obj = {
  myproperty: 'Hello World',
  count: 0
}

function increment () {
  obj.count++

  if (obj.count === 1000) {
    throw new Error('sad trombone')
  }

  setImmediate(increment)
}

setImmediate(increment)
