const db = require('./db');

let collections = {};
let doc = {
    date: new Date(),
    creators: undefined,
    levels: undefined
}

db.connect().then(response => {
    collections = response;
    return db.count(collections.creators);
}).then((res) => {
    doc.creators = res;
    return db.count(collections.levels);
}).then((res) => {
    doc.levels = res;
    return db.insertOne(collections.analytics, doc);
}).then((res) => {
    console.log(res);
    process.exit();
}).catch(err => {
    console.log(err);
    process.exit();
});