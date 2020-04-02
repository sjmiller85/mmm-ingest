const mongoose = require("mongoose");
const utils = require("../../utils");
const Schema = mongoose.Schema;

const AnalyticsSchema = new Schema({
  date: {
    type: Date,
    required: true,
    default: new Date().setHours(new Date().getHours(), 0, 0, 0)
  },
  creators: { type: Number, required: true },
  levels: { type: Number, required: true }
});

const model = mongoose.model("Analytic", AnalyticsSchema);

const getAllAnalytics = () => {
  return model
    .find()
    .exec()
    .catch(utils.handleError);
};

const addAnalytics = obj => {
  return model.create(obj).catch(utils.handleError);
};

const deleteAllAnalytics = () => {
  return model.deleteMany().catch(utils.handleError);
};

module.exports = {
  getAllAnalytics,
  addAnalytics,
  deleteAllAnalytics
};
