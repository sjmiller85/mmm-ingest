const db = require('./db');
const iconsBootstrap = require('./icons-bootstrap').icons;

let collections = {};

db.connect().then(response => {
    collections = response;
    // Validate icons collection, repair if necessary
    return db.find(collections.icons, {});
}).then(icons => {
    if (!icons || !icons.length || icons.length !== iconsBootstrap.length) {
        console.log('Icons collection needs to be reset');
        // Icons collection doesn't match the icons bootstrap, flush and re-populate the collection
        return db.deleteMany(collections.icons, {}).then(response => {
            return true;
        });
    }
    console.log('Icons collection is correct');
    return;
}).then((collectionPurged) => {
    if (collectionPurged) {
        // icons collection has been emptied, re-populate it
        return db.insertMany(collections.icons, iconsBootstrap).then(response => {
            console.log('Icons collection has been successfully updated');
            return response;
        });
    }
    return;
}).then(() => {
    console.log('All done!');
    process.exit();
}).catch(err => {
    console.log(err);
    process.exit();
});
