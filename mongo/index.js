const mongoose = require("mongoose");
const models = require("./models");
const utils = require("../utils");

const connect = (url, db, cb) => {
  mongoose.connect(url + db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });

  let connection = mongoose.connection;

  connection.once("open", () => {
    cb();
  });

  connection.on("error", err => {
    utils.handleError(err);
  });
};

module.exports = {
  connect,
  models
};
