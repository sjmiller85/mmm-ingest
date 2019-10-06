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
        newDownloadsArray.push({date: new Date(), downloads: level.currentDownloads});

        updatePromises.push(collections.levels.updateOne({ id: level.id }, { $set: {downloads: newDownloadsArray} }));

        level.score.forEach(s => {
            if (s.score != currentScore) {
                currentScore = s.score;
                newScoreArray.push(s);
            }
        });
        newScoreArray.push({date: new Date(), score: level.currentScore});

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
        newLevelSizeArray.push({date: new Date(), level_size: creator.currentLevelSize});

        updatePromises.push(collections.creators.updateOne({ id: creator.id }, { $set: {level_size: newLevelSizeArray} }));

        creator.score.forEach(s => {
            if (s.score != currentScore) {
                currentScore = s.score;
                newScoreArray.push(s);
            }
        });
        newScoreArray.push({date: new Date(), score: creator.currentScore});

        updatePromises.push(collections.creators.updateOne({ id: creator.id }, { $set: {score: newScoreArray} }));

        if (creator.avgScore) {
            creator.avgScore.forEach(as => {
                if (as.score != currentAvgScore) {
                    currentAvgScore = as.score;
                    newAvgScoreArray.push(as);
                }
            });
            newAvgScoreArray.push({date: new Date(), score: creator.currentAvgScore});
            updatePromises.push(collections.creators.updateOne({ id: creator.id }, { $set: {avgScore: newAvgScoreArray} }));
        }
    });
    
    return Promise.all(updatePromises);
}).then(res => {
    setTimeout(() => {
        console.log('Done!');
        process.exit()
    }, 60000);
}).catch(err => {
    console.log(err);
    process.exit();
});