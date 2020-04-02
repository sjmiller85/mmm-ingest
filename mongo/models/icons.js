const mongoose = require("mongoose");
const utils = require("../../utils");
const Schema = mongoose.Schema;

const IconSchema = new Schema({
  id: { type: Number, required: true },
  type: { type: String, required: true },
  base64: { type: String, required: true }
});

const model = mongoose.model("Icon", IconSchema);

const checkIconExists = (id, type) => {
  return model.findOne({ id, type });
};

const addUserAvatar = async id => {
  const iconExists = await checkIconExists(id, "user").catch(utils.handleError);

  if (!iconExists) {
    const base64 = await utils.api.getUserAvatar(id).catch(utils.handleError);
    await model.create({ id, type: "user", base64 }).catch(utils.handleError);
  }
};

const addBossAvatar = async id => {
  const iconExists = await checkIconExists(id, "boss").catch(utils.handleError);
  if (!iconExists && id) {
    const base64 = await utils.api.getBossAvatar(id).catch(utils.handleError);
    await model.create({ id, type: "boss", base64 }).catch(utils.handleError);
  }
};

const deleteAllIcons = () => {
  return model.deleteMany().catch(utils.handleError);
};

module.exports = {
  checkIconExists,
  addUserAvatar,
  addBossAvatar,
  deleteAllIcons
};
