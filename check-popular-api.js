const db = require('./db');
const utils = require('./utils')

let collections = {};

db.connect().then(response => {
    collections = response;
    // Check for new users from the popular list
    return utils.getRequest('https://megamanmaker.com/megamaker/level/?sort=popular');
}).then((res) => {
    //  Check if users already exist in the creators collection    const uniques = levels.filter((level, index, self) => self.map(obj => obj.name).indexOf(level.name) === index);
    const queries = res.map(level => {
        return db.find(collections.creators, { id: level.user }).then(arr => {
            if (!arr.length) {
                console.log('Add new creator: ' + level.username);
                if (!level.username) {
                    console.log('ERROR!', level);
                }
                return db.insertOne(collections.creators, { id: level.user, creator: level.username, queued: true });
            }
        });
    });

    return Promise.all(queries);
}).then(() => {
    console.log('All done!');
    process.exit();
}).catch(err => {
    console.log(err);
    process.exit();
});