const mongoose = require("mongoose");
const config = require("../../config");
const utils = require("../../utils");
const queue = require("./queue");
const Schema = mongoose.Schema;

const DownloadsSchema = new Schema({
  date: { type: Date, required: true, default: new Date() },
  downloads: { type: Number, required: true }
});

const ScoreSchema = new Schema({
  date: { type: Date, required: true, default: new Date() },
  score: { type: Number, required: true }
});

const LevelSchema = new Schema({
  id: { type: Number, required: true },
  date: { type: Date, required: true, default: new Date() },
  downloads: [DownloadsSchema],
  name: { type: String, required: true },
  score: [ScoreSchema],
  updated: { type: Date, required: true },
  user: { type: Number, required: true },
  username: { type: String, required: true },
  currentDownloads: { type: Number, required: true },
  currentScore: { type: Number, required: true },
  boss: { type: Number, required: true, default: false },
  deleted: { type: Boolean, required: true, default: false }
});

LevelSchema.index({ id: 1 }, { unique: true });
LevelSchema.index({ name: 1 });

const model = mongoose.model("Level", LevelSchema);

const getOutdatedLevels = () => {
  return model
    .find({
      updated: { $lt: new Date(Date.now() - config.threshold * 1.5 * 60 * 1000) },
      deleted: false
    })
    .sort({ updated: 1 })
    .exec()
    .catch(utils.handleError);
};

const addLevelIfDoestExist = async level => {
  const existingLevel = await model
    .findOne({ id: level.id })
    .catch(utils.handleError);

  if (existingLevel) {
    return;
  }

  return model.create({
    id: level.id,
    date: new Date(level.date),
    downloads: [{ downloads: level.downloads }],
    name: level.name,
    score: [{ score: level.score }],
    updated: new Date(),
    user: level.user,
    username: level.username,
    currentDownloads: level.downloads,
    currentScore: level.score,
    boss: level.boss
  });
};

const updateLevel = async level => {
  if (level.error) {
    await model
      .updateOne({ id: level.id }, { deleted: true })
      .catch(utils.handleError);
    return await queue
      .removeFromQueue("level", level.id)
      .catch(utils.handleError);
  }

  const currentLevel = await model
    .findOne({ id: level.id }, { downloads: 1, score: 1 })
    .catch(utils.handleError);

  let doc = {
    id: level.id,
    date: new Date(level.date),
    name: level.name,
    updated: new Date(),
    user: level.user,
    username: level.username,
    currentDownloads: level.downloads,
    currentScore: level.score,
    boss: level.boss
  };

  if (currentLevel) {
    doc.$push = {};
    const lastDownloads = currentLevel.downloads.slice(-1).pop().downloads;
    const lastScore = currentLevel.score.slice(-1).pop().score;
    if (lastDownloads !== level.downloads) {
      doc.$push.downloads = { downloads: level.downloads };
    }
    if (lastScore !== level.score) {
      doc.$push.score = { score: level.score };
    }
    await model.updateOne({ id: level.id }, doc).catch(utils.handleError);
  } else {
    doc.score = [{ score: level.score }];
    doc.downloads = [{ downloads: level.downloads }];
    await model.create(doc).catch(utils.handleError);
  }

  return await queue
    .removeFromQueue("level", level.id)
    .catch(utils.handleError);
};

const getAllLevels = () => {
  return model
    .find()
    .exec()
    .catch(utils.handleError);
};

const deleteLevel = id => {
  return model.deleteOne({ id }).catch(utils.handleError);
};

const addLevelToDb = level => {
  return model.create(level).catch(utils.handleError);
};

const getCount = () => {
  return model.countDocuments();
};

module.exports = {
  getOutdatedLevels,
  addLevelIfDoestExist,
  updateLevel,
  getAllLevels,
  deleteLevel,
  addLevelToDb,
  getCount
};
