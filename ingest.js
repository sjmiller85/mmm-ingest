const ps = require('ps-node');
const config = require('./config');
const db = require('./db');
const utils = require('./utils')

let collections = {};
let levels = [];
let avgScoreQueue = [];

db.connect().then(response => {
    collections = response;
    // Find outdated creators
    console.log('Queueing up creators');
    return queueUpOutdated(collections.creators);
}).then(() => {
    // add the outdated creators to the queue
    console.log('Get an array of outdate creators');
    return getOutdatedCreators();
}).then((creators) => {
    // HTTPS requests to MMM api
    console.log('Querying for creator info from MMM API');
    return queryForInfo(creators);
}).then((info) => {
    creators = preserveLevelInfo(info); // returns var info sans levels array
    console.log('Updating creator info');
    return updateCreatorInfo(info);
}).then(() => {
    // Update the level data we got from creators
    console.log('Updating level info from creators');
    return updateLevels(levels);
}).then(() => {
    // Find outdated levels
    console.log('Querying for remaining outdated levels');
    return queueUpOutdated(collections.levels);
}).then(() => {
    // All that's left is to clean up the remaining levels
    console.log('Getting outdated levels');
    return getOutdatedLevels();
}).then((levels) => { // levels is an array of id's unlike obj's from creators
    console.log('Querying for level info from MMM API');
    return queryForInfo(levels);
}).then((levels) => {
    console.log('Updating level info');
    return updateLevels(levels);
}).then(() => {
    return getAvgScores();
}).then((scores) => {
    return updateAvgScores(scores);
}).then(() => {
    console.log('Update complete!');
    process.exit();
}).catch(err => {
    console.log(err);
    process.exit();
});

const queueUpOutdated = (collection) => {
    const threshold = new Date(new Date().getTime() - config.threshold);
    return db.updateMany(collection, {
        $or: [
            {updated: {$exists: false}},
            {updated: {$lt: threshold}}
        ], 
        deleted: { $exists: false }
    }, {
        $set: {
            queued: true
        }
    });
};

const getOutdatedCreators = () => {
    return db.find(collections.creators, { queued: true }, { _id: 0, id: 1, name: 1 });
};

const queryForInfo = (arr) => {
    if (!arr.length) return;

    let requests = arr.map(ele => {
        if (typeof ele === 'object') { // object === creator
            return 'https://megamanmaker.com/megamaker/user/' + ele.id;
        } else { // else level
            return 'https://megamanmaker.com/megamaker/level/info/' + ele;
        }
    });

    return utils.runPromisesInSerial(requests, utils.getRequest)
};

const preserveLevelInfo = (creators) => {
    if (!creators || creators.length === 0) return;

    creators.map(creator => {
        if (!creator.error) {
            levels = levels.concat(creator.levels);
            delete creator.levels;
        }

        return creator;
    });
};

const updateCreatorInfo = (creators) => {
    if (!creators || creators.length === 0) return;

    const updates = creators.map(creator => {
        avgScoreQueue.push(creator.id); // reserve the id's for updating the average scores
        if (creator.error) {
            const id = creator.id
            return db.updateOne(collections.creators, { id: id }, { $set: { 
                deleted: true, 
                queued: false, 
                updated: new Date() 
            }});
        }

        return db.updateOne(collections.creators, { id: creator.id }, { 
            $set: {
                name: creator.name,
                icon: creator.icon,
                admin: creator.admin,
                updated: new Date(),
                queued: false,
                currentScore: creator.score,
                currentLevelSize: creator.level_size
            },
            $addToSet: {
                score: { date: new Date(), score: creator.score },
                level_size: { date: new Date(), level_size: creator.level_size }
            }
        });
    });

    return Promise.all(updates);
};

const updateLevels = (levels) => {
    if (!levels || levels.length === 0) return;

    const updates = levels.map(level => {
        if(level.error) {
            const id = level.id;
            return db.updateOne(collections.levels, { id: id }, { 
                $set: {
                    id: id,
                    deleted: true, 
                    queued: false, 
                    updated: new Date()
                }
            }, { upsert: true });
        }
        
        return db.updateOne(collections.levels, { id: level.id }, {
            $set: {
                id: level.id,
                name: level.name,
                user: level.user,
                boss: level.boss,
                username: level.username,
                date: new Date(level.date),
                updated: new Date(),
                queued: false,
                currentScore: level.score,
                currentDownloads: level.downloads
            },
            $addToSet: {
                score: { date: new Date(), score: level.score },
                downloads: { date: new Date(), downloads: level.downloads }
            }
        }, { upsert: true });
    });

    return Promise.all(updates);
};

const getOutdatedLevels = () => {
    return db.distinct(collections.levels, 'id', { queued: true }); // return just [ id, id, ... ]
};

const getAvgScores = () => {
    const queries = avgScoreQueue.map(id => {
        return db.aggregate(collections.levels, [ { $match: { user: id } }, { 
            $group: { 
                _id: "$user", 
                score: { 
                    $avg: { 
                        $arrayElemAt: [ '$score.score', -1 ] 
                    } 
                } 
            }}]
        );
    });

    return Promise.all(queries);
};

const updateAvgScores = (arr) => {
    const scores = arr.map(score => {
        return score[0];
    });

    const updates = scores.map(obj => {
        return db.updateOne(collections.creators, { id: obj._id}, {
            $set: {
                currentAvgScore: Math.round(obj.score * 100) / 100;
            },
            $addToSet: {
                avgScore: { date: new Date(), score: obj.score }
            }
        });
    });

    return Promise.all(updates);
};