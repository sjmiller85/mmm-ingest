const utils = require('./utils');
const db = require('./db');
let collections = [];

db.connect().then((res) => {
    collections = res;
    return db.find(collections.creatorbkup, {});
}).then((creators) => {
    const arr = shuffle(creators);
    return utils.runPromisesInSerial(arr, update);
}).then(() => {
    console.log('All done');
    process.exit();
}).catch(err => {
    throw err;
});

const update = (creator) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('Queueing Creator: ' + creator.name)
            return db.updateOne(collections.creators, { id: creator.id }, { $set: { queued: true }})
                .then(resolve())
                .catch(reject(new Error('Error updating!')));
        }, 300000);
    });
};

const shuffle = (array) => {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  };
  
  