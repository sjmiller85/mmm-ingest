const db = require('./db');

let collections = [];
let featured = { date: new Date(new Date().toLocaleDateString()) };

db.connect().then(response => {
    collections = response;
    const daysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    return db.findSortAndLimit(collections.levels, 
        { date: { $gt: daysAgo } }, // greater than 7 days ago
        undefined, // no projection
        { currentScore: -1 }, // Sort by score desc
        10 // limit to 10 docs
    );
}).then((docs) => {
    const randomLevel = docs[Math.floor(Math.random() * docs.length)];
    featured.level = randomLevel.id;

    const daysAgo = new Date(new Date().setDate(new Date().getDate() - 14));
    return db.find(collections.levels, { date: { $gt: daysAgo } });
}).then((docs) => {
    const ids = docs.map(level => { // get the user ids for the levels
        return { id: level.user }
    });
    return db.findSortAndLimit(collections.creators,
        { $or: ids },
        undefined,
        { currentAvgScore: -1 },
        10
    );
}).then((creators) => {
    const randomCreator = creators[Math.floor(Math.random() * creators.length)];
    featured.creator = randomCreator.id;
    return db.insertOne(collections.featured, featured);
}).then(() => {
    console.log('All done!');
    process.exit();
}).catch(err => {
    console.log(err);
    process.exit();
});