const https = require('https');
const config = require('./config');

// HTTPS request utility method
const getRequest = (url) => {
    return new Promise((resolve, reject) => {
        console.log(new Date() + ' - ' + url);
        setTimeout(() => {
            https.get(url, res => {
                let body = '';
                
                res.on('data', chunk => {
                    body += chunk;
                })
                res.on('end', () => {
                    resolve(checkIfErrorInRequest(JSON.parse(body), url));
                });
            }).on('error', (err) => {
                reject('HTTPS Error: ' + err.message);
            });
        }, config.httpsDelay);
    });
};

const checkIfErrorInRequest = (body, url) => {
    // Checks if the get request returned an error, indicating it doesn't exist or was deleted
    if (body.error) {
        if (url.includes('level')) {
            // It was a level
            body.type = 'level';
            body.id = Number(url.substr(url.lastIndexOf('/') + 1));
        }
        if (url.includes('name')) {
            // It was a creator
            body.type = 'creator';
            body.id = url.substr(url.lastIndexOf('=') + 1);
        }
    }

    return body;
}

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