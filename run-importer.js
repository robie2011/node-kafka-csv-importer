const fs = require("fs")
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const kafka = require('kafka-node')
const lineByLine = require('n-readlines')
const makePromise = require('./makePromise')
const tee = require('./tee')

// config
const csvFile = config.csvFile
const topicname_prefix = config.importer['topic.simple'].topicPrefix
const batchSize = config.batchSize
const kafkaHost = config.kafkaHost


const dataSource = () => {
    const unix = d => Math.round((d).getTime() / 1000);
    const lineExtractor = str => {
        let raw = str.trim().split('\t')
        let obj = {
            numericId: parseInt(raw[0]),
            quality: parseInt(raw[1]),
            value: raw[2], // to prevent rounding errors, we let this to be string as it is
            // asuming this was recorded in our timezone, https://stackoverflow.com/questions/32252565/javascript-parse-utc-date
            timestamp: unix(new Date(raw[3] + 'Z'))
        }

        return obj
    }

    let liner = new lineByLine(csvFile)
    return {
        next: batchSize => {
            let count = 0
            let lines = []
            let line = liner.next()
            while (line && count < batchSize) {
                ++count
                lines.push(line.toString('utf8'))
            }

            return lines.map(lineExtractor)
        }
    }
}


function createProducer() {
    console.log('creating producer');
    return new Promise((resolve, reject) => {
        const producer = new kafka.Producer(new kafka.KafkaClient({ kafkaHost }))

        producer.on('ready', function () {
            console.log('producer ready')
            resolve(producer);
        });

        producer.on('error', function (err) {
            reject(err);
        })
    })
}


const simpleRawMapper = entry => {
    return {
        topic: topicname_prefix + "_" + entry.numericId,
        messages: [entry.value],
        key: entry.quality,
        attributes: 0, // no compression
        timestamp: entry.timestamp
    }
}

createProducer().then(producer => {
    console.log("batchSize: ", batchSize)
    let batchCount = 0
    const source = dataSource()
    const runBatchLoop = () => {
        batchCount++
        let produceRequests = source
            .next(batchSize)
            .map(simpleRawMapper)

        console.log("sending batch#:", batchCount)
        producer.send(produceRequests, (err, data) => {
            if (err) {
                console.error(err)
                console.log(produceRequests)
            }
            else {
                runBatchLoop()
            }
        })

    }

    runBatchLoop()
}).catch(console.error)
