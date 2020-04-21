const config = require("./config");
const utils = require("./utils");
const mongo = require("./mongo");

mongo.connect(config.dbUrl, config.dbName, async () => {
  const creatorCount = await mongo.models.creators.getCount();
  const levelCount = await mongo.models.levels.getCount();

  await mongo.models.analytics.addAnalytics({
    creators: creatorCount,
    levels: levelCount
  });

  process.exit();
});
