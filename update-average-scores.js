const db = require('./db');

let collections = {};

db.connect().then(response => {
    collections = response;
    // Get the average score of creator's levels
    return getCreatorScoreAverages();
}).then((creators) => {
    // Update creators collection with averages
    return updateCreatorsAverages(creators);
}).then(() => {
    // Exit
    process.exit();
}).catch(err => {
    console.log(err);
    process.exit();
});

const getCreatorScoreAverages = () => {
    console.log('Getting average scores of levels');
    return db.aggregate(collections.levels, [ { $match: {} }, { 
        $group: { 
            _id: "$username", 
            score: { 
                $avg: { 
                    $arrayElemAt: [ '$score.score', -1 ] 
                } 
            } 
        }}]
    );
};

const updateCreatorsAverages = (creators) => {
    console.log('Updating average scores');
    let updates = creators.map(creator => {
        return db.updateOne(collections.creators, { name: creator._id }, { 
            $addToSet: {
                avgScore: {
                    date: new Date(),
                    score: creator.score 
                }
            }
        });
    });

    return Promise.all(updates);
};