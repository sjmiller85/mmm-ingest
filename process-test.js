const ps = require('ps-node');

ps.lookup({ command: 'node', arguments: 'ingest.js' }, (err, res) => {
    console.log(res);
    res.forEach((process) => {
        console.log(process);
    })
})