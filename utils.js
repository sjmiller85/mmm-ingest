const https = require('https');
const config = require('./config');

// HTTPS request utility method
const getRequest = (url) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            https.get(url, res => {
                let body = '';
                
                res.on('data', chunk => {
                    body += chunk;
                })
                res.on('end', () => {
                    resolve(JSON.parse(body));
                });
            }).on('error', (err) => {
                reject('HTTPS Error: ' + err.message);
            });
        }, config.httpsDelay);
    });
};

const runPromisesInSerial = (promises, method) => {
    return new Promise((resolve, reject) => {
        promises.reduce((promiseChain, currentTask) => {
            return promiseChain.then((acc) => method(currentTask).then((res) => [...acc, res]));
        }, Promise.resolve([])).then(results => {
            resolve(results);
        }).catch(err => {
            reject(err);
        });
    });
};

module.exports = {
    getRequest: getRequest,
    runPromisesInSerial: runPromisesInSerial
}