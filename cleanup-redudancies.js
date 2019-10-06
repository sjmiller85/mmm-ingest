const db = require('./db');

let collections = {};
let doc = {
    date: new Date(),
    creators: undefined,
    levels: undefined
}

db.connect().then(response => {
    collections = response;
    return collections.levels.find();
}).then((res) => {
    let updatePromises = [];
    res.forEach(level => {
        let currentDownloads = 0;
        let newDownloadsArray = [];
        let currentScore = 0;
        let newScoreArray = [];

        level.downloads.forEach(dl => {
            if (dl.downloads != currentDownloads) {
                currentDownloads = dl.downloads;
                newDownloadsArray.push(dl);
            }
        });

        updatePromises.push(collections.levels.updateOne({ id: level.id }, { $set: {downloads: newDownloadsArray} }));

        level.score.forEach(s => {
            if (s.score != currentScore) {
                currentScore = s.score;
                newScoreArray.push(s);
            }
        });

        updatePromises.push(collections.levels.updateOne({ id: level.id }, { $set: {score: newScoreArray} }));
    });
    
    return Promise.all(updatePromises);
}).then((res) => {
    return collections.creators.find();
}).then((res) => {
    let updatePromises = [];
    res.forEach(creator => {
        let currentLevelSize = 0;
        let newLevelSizeArray = [];
        let currentScore= 0;
        let newScoreArray = [];
        let currentAvgScore= 0;
        let newAvgScoreArray = [];

        creator.level_size.forEach(ls => {
            if (ls.level_size != currentLevelSize) {
                currentLevelSize = ls.level_size;
                newLevelSizeArray.push(ls);
            }
        });

        updatePromises.push(collections.creators.updateOne({ id: creator.id }, { $set: {level_size: newLevelSizeArray} }));

        creator.score.forEach(s => {
            if (s.score != currentScore) {
                currentScore = s.score;
                newScoreArray.push(s);
            }
        });

        updatePromises.push(collections.creators.updateOne({ id: creator.id }, { $set: {score: newScoreArray} }));

        if (creator.avgScore) {
            creator.avgScore.forEach(as => {
                if (as.score != currentAvgScore) {
                    currentAvgScore = as.score;
                    newAvgScoreArray.push(as);
                }
            });
        }
        
        updatePromises.push(collections.creators.updateOne({ id: creator.id }, { $set: {avgScore: newAvgScoreArray} }));
    });
    
    return Promise.all(updatePromises);
}).then(() => {
    console.log('Done!');
}).catch(err => {
    console.log(err);
    process.exit();
});