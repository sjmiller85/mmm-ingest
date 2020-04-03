const config = require("./config");
const utils = require("./utils");
const mongo = require("./mongo");
const ids = require("./ids");
const fs = require("fs");

mongo.connect(config.dbUrl, config.dbName, async () => {
  await mongo.models.creators.updateDeleted();

  process.exit();
});
