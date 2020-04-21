const mongoose = require("mongoose");
const config = require("../../config");
const utils = require("../../utils");
const Schema = mongoose.Schema;

const ThresholdsSchema = new Schema({
  date: { type: Date, required: true, default: new Date() },
  limit: { type: Number, required: true },
  minutes: { type: Number, required: true }
});

const model = mongoose.model("Threshold", ThresholdsSchema);

let threshold = 0;

const getThreshold = () => {
  return threshold;
};

const setThreshold = val => {
  threshold = val;
  return val;
};

const getLatestThreshold = async () => {
  const threshold = await model
    .find()
    .sort({ date: -1 })
    .limit(1)
    .exec()
    .catch(utils.handleError);

  setThreshold(threshold[0]);
  return getThreshold();
};

const calculateThreshold = async () => {
  const creators = require("./creators");
  const creatorCount = await creators.getCount();
  const limit = config.limit;

  const refreshMinutes = Math.ceil(creatorCount / limit);

  return refreshMinutes;
};

const updateThreshold = async () => {
  const last = await getLatestThreshold();
  const current = await calculateThreshold();

  if (last && (last.minutes !== current || last.limit !== config.limit)) {
    setThreshold({
      date: new Date(),
      limit: config.limit,
      minutes: current
    });
    return model.create(getThreshold());
  }

  return;
};

module.exports = {
  getThreshold,
  setThreshold,
  getLatestThreshold,
  calculateThreshold,
  updateThreshold
};
