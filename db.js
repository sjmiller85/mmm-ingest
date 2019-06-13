const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

const connect = () => {
    console.log('Connecting to MongoDB');
    return MongoClient.connect(config.dbUrl, {useNewUrlParser: true}).then((client) => {
        console.log('Connected to MongoDB');
        const db = client.db(config.dbName);

        // global collections object
        return {
            creators: db.collection('creators'),
            icons:    db.collection('icons'),
            levels:   db.collection('levels'),
            queue:    db.collection('queue')
        };
    }).catch(err => {
        new Error(err);
    });
};

const find = (collection, query) => {
    return collection.find(query).toArray();
};

const deleteMany = (collection, query) => {
    return collection.deleteMany(query);
};

const insertOne = (collection, query) => {
    return collection.insertOne(query);
};

const insertMany = (collection, query) => {
    return collection.insertMany(query);
};

const updateOne = (collection, selector, updates) => {
    return collection.updateOne(selector, updates);
};

module.exports = {
    connect: connect,
    find: find,
    deleteMany: deleteMany,
    insertOne: insertOne,
    insertMany: insertMany,
    updateOne: updateOne
};