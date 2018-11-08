const makePromise = require('./makePromise')

function f1(data1, cb) {
    console.log("data1: ", data1);
    cb('error!')
}

function f2(data1, cb) {
    console.log("data1: ", data1);
    cb(null, 'data')
}


let a1 = makePromise(f1)
let a2 = makePromise(f2)
// a1('hello').then(console.log).catch(console.error)

console.log("test2")
a2('hello').then(console.log).catch(console.error)