
var makePromise = f => (...args) => {
    console.log(args)
    return new Promise((resolve, reject) => {
        const cb = (err, data) => {
            if (err) reject(err)
            else resolve(data)
        }

        switch (args.length) {
            case 0:
                f(cb)
                break;

            case 1:
                f(args[0], cb)
                break;

            case 2:
                f(args[0], args[1], cb)
                break;


            case 3:
                f(args[0], args[1], args[2], cb)
                break;

            default:
                throw 'Not Implemented for argment length: ' + args.length
                break;
        }
    })
}

module.exports = makePromise