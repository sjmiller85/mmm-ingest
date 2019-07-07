const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

const connect = () => {
    return new Promise((resolve, reject) => {
        console.log('Connecting to MongoDB');
        MongoClient.connect(config.dbUrl, {useNewUrlParser: true}).then((client) => {
            console.log('Connected to MongoDB');
            const db = client.db(config.dbName);
            let existingCollections = [];

            // We need to verify the collections exist and if not, create them so we can index them
            db.listCollections({}, { nameOnly: true }).toArray().then(res => {
                existingCollections = res.map(obj => obj.name);

                if (existingCollections.indexOf('creators') < 0) {
                    console.log('creating "creators" collection');
                    return Promise.all([
                        db.collection('creators').createIndex({ id: 1 }, { unique: true }),
                        db.collection('creators').createIndex({ name: 1 }, { unique: true }),
                    ]);
                }
                return;
            }).then(() => {
                if (existingCollections.indexOf('levels') < 0) {
                    console.log('creating "levels" collection');
                    return Promise.all([
                        db.collection('levels').createIndex({ id: 1 }, { unique: true }),
                        db.collection('levels').createIndex({ name: 1 }),
                    ]);
                }
                return;
            }).then(() => {
                resolve({
                    creators: db.collection('creators'),
                    icons:    db.collection('icons'),
                    levels:   db.collection('levels'),
                    queue:    db.collection('queue'),
                    creatorbkup: db.collection('creatorbkup')
                });
            }).catch(err => {
                reject(new Error(err));
            });
        }).catch(err => {
            new Error(err);
        });
    });
};

const find = (collection, query, projection, throttle) => {
    if (projection && throttle) {
        return collection.find(query).project(projection).limit(5).toArray();
    }
    if (projection) {
        return collection.find(query).project(projection).toArray();
    }

    return collection.find(query).toArray();
};

const distinct = (collection, key, query, options = {}) => {
    return collection.distinct(key, query, options);
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

const updateOne = (collection, selector, updates, options = {}) => {
    return collection.updateOne(selector, updates, options);
};

const updateMany = (collection, selector, updates, options = {}) => {
    return collection.updateMany(selector, updates, options);
};

const aggregate = (collection, query) => {
    return collection.aggregate(query).toArray();
}

module.exports = {
    connect: connect,
    find: find,
    distinct: distinct,
    deleteMany: deleteMany,
    insertOne: insertOne,
    insertMany: insertMany,
    updateOne: updateOne,
    updateMany: updateMany,
    aggregate: aggregate
};