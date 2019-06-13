const https = require('https');
const config = require('./config');
const db = require('./db');
const utils = require('./utils')
const iconsBootstrap = require('./icons-bootstrap').icons;

let collections = {};

db.connect().then(response => {
    collections = response;
    // TODO: remove this
    return clearQueue();
}).then(() => {
    // TODO: remove this
    return db.insertOne(collections.queue, { creator: "Chronoas" });
}).then(() => {
    // Check icons collection for consistency
    return verifyIconsCollection();
}).then(() => {
    // First get a list of all creators that need updating
    return getOutdatedCreators();
}).then((outdatedCreators) => {
    // add the outdated creators to the queue
    return addOutdatedCreatorsToQueue(outdatedCreators);
}).then(() => {
    // get a list of all levels that need updating
    return getOutdatedLevels();
}).then((outdatedLevels) => {
    // add outdated levels to the queue
    return addOutdatedLevelsToQueue(outdatedLevels);
}).then(() => {
    // First get a list of all creators in the queue
    return getCreatorsFromQueue();
}).then(creatorsInQueue => {
    // Query the Mega Man Maker API for creator info
    return queryForCreatorInfo(creatorsInQueue);
}).then(creatorData => {
    // Update the creators in MongoDB
    return updateAndAddCreatorsToDatabase(creatorData);
}).then(creatorLevels => {
    // Insert/update creator levels
    return updateAndAddLevelsToDatabase(creatorLevels);5
}).then(() => {
    return clearQueue();
});

    
const verifyIconsCollection = () => {
    // Load the icons collection to check it
    return db.find(collections.icons, {}).then(icons => {
        if (!icons || !icons.length || icons.length !== iconsBootstrap.length) {
            console.log('Icons collection needs to be reset');
            // Icons collection doesn't match the icons bootstrap, flush and re-populate the collection
            return db.deleteMany(collections.icons, {}).then(response => {
                resolve(true);
            });
        }
        console.log('Icons collection is correct');
        return;
    }).then((collectionPurged) => {
        if (collectionPurged) {
            // icons collection has been emptied, re-populate it
            return db.insertMany(collections.icons, iconsBootstrap).then(response => {
                console.log('Icons collection has been successfully updated');
                resolve(response);
            });
        }
        return;
    });
};

const getOutdatedCreators = () => {
    console.log('Getting outdated Creators from creators collection');
    return db.find(collections.creators, { updated: { $lt: new Date( new Date().getTime() - config.threshold ) } });
}

const addOutdatedCreatorsToQueue = (creators) => {
    if (!creators.length) {  // MongoDB may return an empty array
        return;
    }

    console.log('Adding outdated creators to the queue');
    let names = [];
    for (let creator of creators) {
        names.push({ creator: creator.name }); // create the MongoDB query dynamically
    }

    return db.insertMany(collections.queue, names);
};

const getOutdatedLevels = () => {
    console.log('Getting outdated Levels from levels collection');
    return db.find(collections.levels, { updated: { $lt: new Date( new Date().getTime() - config.threshold ) } });
}

const addOutdatedLevelsToQueue = (levels) => {
    if (!levels.length) { // MongoDB may return an empty array
        return;
    }
    console.log('Adding outdated levels to the queue');
    let ids = [];
    for (let level of levels) {
        ids.push({ level: level.id }); // create the MongoDB query dynamically
    }
    
    return db.insertMany(collections.queue, ids);
};

const getCreatorsFromQueue = () => {
    console.log('getting creators from queue');
    return db.find(collections.queue, { creator: { $exists: true } });
};

const queryForCreatorInfo = (creators) => {
    console.log('Querying the Mega Man Maker API for creators');
    let requests = [];

    for (let creator of creators) {
        // Users may be able to submit either an ID or a name which requires one of two API calls
        if (typeof creator.creator === 'string') {
            requests.push('https://megamanmaker.com/megamaker/user/name?name=' + creator.creator);
        }
        if (typeof creator.creator === 'number') {
            requests.push('https://megamanmaker.com/megamaker/user/' + creator.creator);
        }
    }

    return utils.runPromisesInSerial(requests, utils.getRequest)

};

const updateAndAddCreatorsToDatabase = (creators) => {
    return new Promise((resolve, reject) => {
        let levels = [];
        let creatorNames = [];
        let newCreators = [];

        for (let creator of creators) {
            levels = [ ...levels, ...creator.levels ]; // preserve the levels to add/update later on
            creatorNames.push({ name: creator.name });
        } 
        db.find(collections.creators, { $or: creatorNames }).then(res => {
            newCreators = creators.filter(val => {
                let match = true;
                for (let i of res) {
                    if (i.id === val.id) match = false; 
                }
                return match;
            }); 
            return updateExistingCreators(res, creators); // pass in the creators array so we can update their score and level count
        }).then(() => {
            return insertNewCreators(newCreators);
        }).then(() => {
            resolve(levels);
        }).catch(err => {
            reject(new Error(err));
        });
    });
};

const updateExistingCreators = (dbResults, creators) => {
    console.log('Updating exiting creators');
    let updates = [];

    // TODO: ES6-ify this using .filter()?
    for (let creator of dbResults) { // iterate through what already exists in the db
        for (let record of creators) { // find it's matching API result
            if (record.id === creator.id) {
                creator.score.push({ date: new Date(), score: record.score });
                creator.level_size.push({ date: new Date(), level_size: record.level_size });
            }
        }
        console.log('Updating creator: ' + creator.name);
        updates.push(db.updateOne(collections.creators, { id: creator.id }, 
            { $set: { score: creator.score, level_size : creator.level_size, icon: creator.icon, admin: creator.admin, updated: new Date() }}))
    }

    return Promise.all(updates);
};

const insertNewCreators = (creators) => {
    console.log("Inserting creators");
    var inserts = [];

    for (creator of creators) {
        creator.score = [{ date: new Date(), score: creator.score }];
        creator.level_size = [{ date: new Date(), level_size: creator.level_size }];
        inserts.push(db.insertOne(collections.creators, creator));
        console.log('Inserting new creator: ' + creator.name);
    }

    return Promise.all(inserts);
};

const updateAndAddLevelsToDatabase = (levels) => {
    return new Promise((resolve, reject) => {
        let levelIDs = [];
        let newLevels = [];

        for (level of levels) {
            levelIDs.push({ id: level.id });
        }

        db.find(collections.levels, { $or: levelIDs }).then(res => {
            newLevels = levels.filter(val => {
                let match = true;
                for (let i of res) {
                    if (i.id === val.id) match = false; 
                }
                return match;
            }); 
            return updateExistingLevels(res, levels);
        }).then(() => {
            insertNewLevels(newLevels);
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(new Error(err));
        })
    });
};

const updateExistingLevels = (dbResults, levels) => {
    console.log('Updating existing levels');
    let updates = [];

    // TODO: ES6-ify this using .filter()?
    for (let level of dbResults) { // iterate through what already exists in the db
        for (let record of levels) { // find it's matching API result
            if (record.id === level.id) {
                level.score.push({ date: new Date(), score: record.score });
                level.downloads.push({ date: new Date(), downloads: record.downloads });
            }
        }
        console.log('Updating level: ' + level.id);
        updates.push(db.updateOne(collections.levels, { id: level.id }, 
            { $set: { score: level.score, downloads : level.downloads, updated: new Date() }}))
    }

    return Promise.all(updates);
};

const insertNewLevels = (levels) => {
    console.log("Inserting levels");
    var inserts = [];

    for (level of levels) {
        level.score = [{ date: new Date(), score: level.score }];
        level.downloads = [{ date: new Date(), downloads: level.downloads }];
        inserts.push(db.insertOne(collections.levels, level));
        console.log('Inserting new level: ' + level.id + ' (' + level.name + ')');
    }

    return Promise.all(inserts);
};

const clearQueue = () => {
    setTimeout(() => {
        db.deleteMany(collections.queue, {});
    }, 5000)
};