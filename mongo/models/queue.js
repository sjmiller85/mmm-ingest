const mongoose = require("mongoose");
const utils = require("../../utils");
const Schema = mongoose.Schema;

const QueueSchema = new Schema(
  {
    type: { type: String, required: true },
    id: { type: Number, required: true }
  },
  { collection: "queue" }
);

QueueSchema.index({ id: 1 });
QueueSchema.index({ type: 1 });

const model = mongoose.model("Queue", QueueSchema);

const addToQueue = async (type, id) => {
  const check = await model.findOne({ type, id }).catch(utils.handleError);
  if (!check) {
    return model.create({ type, id });
  } else {
    return;
  }
};

const removeFromQueue = (type, id) => {
  return model.deleteMany({ type, id });
};

const getQueuedCreators = (type, id) => {
  return model.find({ type: "creator" }, "id").exec();
};

const getQueuedLevels = (type, id) => {
  return model.find({ type: "level" }, "id").exec();
};

const purge = () => {
  return model.deleteMany({});
};

module.exports = {
  addToQueue,
  removeFromQueue,
  getQueuedCreators,
  getQueuedLevels,
  purge
};
