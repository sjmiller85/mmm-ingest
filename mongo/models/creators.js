const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const config = require("../../config");
const queue = require("./queue");
const utils = require("../../utils");

const LevelSizeSchema = new Schema({
  date: { type: Date, required: true, default: new Date() },
  level_size: { type: Number, required: true }
});

const ScoreSchema = new Schema({
  date: { type: Date, required: true, default: new Date() },
  score: { type: Number, required: true }
});

const CreatorSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  admin: { type: Boolean, required: true },
  icon: { type: Number, required: true },
  level_size: [LevelSizeSchema],
  score: [ScoreSchema],
  updated: { type: Date, required: true, default: new Date() },
  avgScore: [ScoreSchema],
  currentLevelSize: { type: Number, required: true },
  currentScore: { type: Number, required: true },
  currentAvgScore: { type: Number, required: true },
  deleted: { type: Boolean, required: true, default: false }
});

CreatorSchema.index({ id: 1 }, { unique: true });
CreatorSchema.index({ name: 1 }, { unique: true });

const model = mongoose.model("Creator", CreatorSchema);

const getNonExistentCreatorIDs = async ids => {
  const creatorIDs = await model
    .find(
      {
        id: { $in: ids }
      },
      { id: true }
    )
    .exec()
    .catch(utils.handleError);

  // if we found a record, remove it from the ids array
  creatorIDs.forEach(e => {
    const index = ids.indexOf(e.id);
    ids.splice(index, 1);
  });

  return ids;
};

const getOutdatedCreators = () => {
  return model
    .find(
      { updated: { $lt: new Date(Date.now() - config.threshold * 60 * 1000) } },
      "id"
    )
    .sort({ updated: 1 })
    .limit(55)
    .exec()
    .catch(utils.handleError);
};

const updateCreator = async creator => {
  const docArrays = await model
    .findOne({ id: creator.id }, { level_size: 1, score: 1, avgScore: 1 })
    .catch(utils.handleError);
  let avgScore = 0;

  if (creator.error) {
    creator.id = parseInt(creator.error.match(/\d+/)[0]);
    return model.updateOne({ id: creator.id }, { deleted: true });
  }

  if (creator.levels.length > 0) {
    avgScore = (
      creator.levels
        .map(e => e.score)
        .reduce((previous, current) => (current += previous)) /
      creator.levels.length
    ).toFixed(2);
  }

  let doc = {
    id: creator.id,
    name: creator.name,
    admin: creator.admin,
    icon: creator.icon,
    updated: new Date(),
    currentLevelSize: creator.level_size,
    currentScore: creator.score,
    currentAvgScore: avgScore
  };

  if (docArrays) {
    doc.$push = {};
    const lastLevelSize = docArrays.level_size.slice(-1).pop().level_size;
    const lastScore = docArrays.score.slice(-1).pop().score;
    const lastAvgScore = docArrays.avgScore
      .slice(-1)
      .pop()
      .score.toFixed(2);
    if (lastLevelSize !== creator.level_size) {
      doc.$push.level_size = { level_size: creator.level_size };
    }
    if (lastScore !== creator.score) {
      doc.$push.score = { score: creator.score };
    }
    if (lastAvgScore !== avgScore) {
      doc.$push.avgScore = { score: avgScore };
    }
    await model.updateOne({ id: creator.id }, doc).catch(utils.handleError);
  } else {
    doc.level_size = [{ level_size: creator.level_size }];
    doc.score = [{ score: creator.score }];
    doc.avgScore = [{ score: avgScore }];
    await model.create(doc).catch(utils.handleError);
  }

  return await queue
    .removeFromQueue("creator", creator.id)
    .catch(utils.handleError);
};

const getAllCreators = () => {
  return model
    .find()
    .exec()
    .catch(utils.handleError);
};

const deleteCreator = id => {
  return model.deleteOne({ id: id }).catch(utils.handleError);
};

const addCreatorToDb = creator => {
  return model.create(creator).catch(utils.handleError);
};

const getCount = () => {
  return model.countDocuments();
};

module.exports = {
  getNonExistentCreatorIDs,
  getOutdatedCreators,
  updateCreator,
  getAllCreators,
  deleteCreator,
  addCreatorToDb,
  getCount
};
