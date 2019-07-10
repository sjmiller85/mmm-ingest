const db = require('./db');
const utils = require('./utils')

let collections = {};
let popularCreators = [];
let popularLevels = [];

db.connect().then(response => {
    collections = response;
    // Check for new users from the popular list
    return utils.getRequest('https://megamanmaker.com/megamaker/level/?sort=popular');
}).then((res) => {
    popularCreators = res.map(level => {
        return { id: level.user, name: level.username }
    });
    
    popularLevels = res.map(level => {
        return { id: level.id }
    });

    // Remove duplicates
    popularCreators = popularCreators.filter((creator, index, self) => self.map(obj => obj.id).indexOf(creator.id) === index);

    return db.distinct(collections.creators, 'id', {});
}).then((creators) => {
    let newCreators = []; 
    popularCreators.forEach(creator => {
        if (creators.indexOf(creator.id) === -1) {
            console.log('New Creator: ' + JSON.stringify(creator));
            creator.queued = true;
            newCreators.push(db.insertOne(collections.creators, creator));
        }
    });

    return Promise.all(newCreators);
}).then(() => {
    return db.updateMany(collections.levels, { popular: true }, { $set: { popular: false }});
}).then(() => {
    return db.updateMany(collections.levels, { $or: popularLevels }, { $set: { popular: true }, $addToSet: { popularDates: { date: new Date(new Date().toLocaleDateString()) }}});
}).then(() => {
    console.log('All done!');
    process.exit();
}).catch(err => {
    console.log(err);
    process.exit();
});