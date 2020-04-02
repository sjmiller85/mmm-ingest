const config = require("./config");
const utils = require("./utils");
const mongo = require("./mongo");
const ids = require("./ids");

mongo.connect(config.dbUrl, config.dbName, async () => {
  const startTime = new Date();
  console.log(`Running ingest -- Start time: ${startTime}`);
  let creatorArray = [];
  let levelArray = [];

  let levels = [];

  await mongo.models.queue.purge();

  //
  // Begin code for import of old IDs
  //

  const oldIds = ids.ids;

  const freshIds = await mongo.models.creators.getNonExistentCreatorIDs(oldIds);

  for (let i = 0; i < 10; i++) {
    await mongo.models.queue.addToQueue("creator", freshIds[i]);
  }

  //
  // end code for import of old IDs
  //

  // Get levels from MMM's popular API
  const popularLevels = await utils.api
    .getPopularLevels()
    .catch(utils.handleError);

  // Get the user IDs for the popular levels
  const popularLevelCreatorIDs = utils.getCreatorsFromArray(popularLevels);

  // Get the ids of creators (from the popular API) that aren't in the db
  const nonExistentCreatorIds = await mongo.models.creators
    .getNonExistentCreatorIDs(popularLevelCreatorIDs)
    .catch(utils.handleError);

  console.log(
    `# of creators from the popular API to add: ${nonExistentCreatorIds.length}`
  );

  // Add the ids from above to the queue
  await Promise.all(
    nonExistentCreatorIds.map(e => {
      return mongo.models.queue.addToQueue("creator", e);
    })
  ).catch(utils.handleError);

  // Get the outdated creators in the DB
  const outdatedCreators = await mongo.models.creators
    .getOutdatedCreators()
    .catch(utils.handleError);

  // Add the outdated creators to the queue
  await Promise.all(
    outdatedCreators.map(e => {
      return mongo.models.queue.addToQueue("creator", e.id);
    })
  ).catch(utils.handleError);

  // Get the creators from the queue
  const queuedCreators = await mongo.models.queue
    .getQueuedCreators()
    .catch(utils.handleError);

  // Remove any possible duplicates
  const queuedCreatorIDs = queuedCreators.map(e => e.id);
  const uniqueQueuedCreatorIDs = queuedCreatorIDs.filter(
    (e, i) => queuedCreatorIDs.indexOf(e) === i
  );

  console.log(`# of creators queued: ${uniqueQueuedCreatorIDs.length}`);

  // Get the creators from the MMM API
  for (let id of uniqueQueuedCreatorIDs) {
    creatorArray.push(
      await utils.api.getCreatorData(id).catch(utils.handleError)
    );
  }

  // Get an array of user icons
  const icons = creatorArray.map(e => {
    return e.icon;
  });

  // Remove any duplicates from the icon array
  const iconsNoDups = icons.filter((e, i) => icons.indexOf(e) === i);

  // Add any icons to the db if they don't exist already
  for (let id of iconsNoDups) {
    await mongo.models.icons.addUserAvatar(id).catch(utils.handleError);
  }

  // Update the creators collection
  await Promise.all(
    creatorArray.map(e => {
      return mongo.models.creators.updateCreator(e);
    })
  ).catch(utils.handleError);

  // Get the levels from the creator array so we don't have to double the load on the API
  creatorArray.forEach(e => {
    levels = levels.concat(e.levels);
  });

  // Add any levels from the creators array that don't already exist in the db
  await Promise.all(
    levels.map(e => {
      return mongo.models.levels.addLevelIfDoestExist(e);
    })
  ).catch(utils.handleError);

  // Get outdated levels
  const outdatedLevels = await mongo.models.levels
    .getOutdatedLevels()
    .catch(utils.handleError);

  // Add outdated Levels to the queue
  await Promise.all(
    outdatedLevels.map(e => {
      return mongo.models.queue.addToQueue("level", e.id);
    })
  ).catch(utils.handleError);

  // Get queued Levels from the queue collection
  const queuedLevels = await mongo.models.queue
    .getQueuedLevels()
    .catch(utils.handleError);

  // Remove any possible duplicates
  const queuedLevelIDs = queuedLevels.map(e => e.id);
  const uniqueQueuedLevelIDs = queuedLevelIDs.filter(
    (e, i) => queuedLevelIDs.indexOf(e) === i
  );

  console.log(`# of levels queued: ${uniqueQueuedLevelIDs.length}`);

  // Get the creators from the MMM API
  for (let id of uniqueQueuedLevelIDs) {
    levelArray.push(await utils.api.getLevelData(id).catch(utils.handleError));
  }

  // Get an array of all the boss icons from the oudated levels array
  const bossIcons = levelArray.map(e => {
    // level might be deleted, check for boss value
    if (e.boss) return e.boss;
  });

  // Remove any duplicates from the boss icons array
  const bossIconsNoDups = bossIcons.filter(
    (e, i) => bossIcons.indexOf(e) === i
  );

  // Add any boss icons that don't already exist in the db
  for (let id of bossIconsNoDups) {
    await mongo.models.icons.addBossAvatar(id).catch(utils.handleError);
  }

  // Update levels in the db
  await Promise.all(
    levelArray.map(e => {
      return mongo.models.levels.updateLevel(e);
    })
  ).catch(utils.handleError);

  const endTime = new Date();
  console.log(
    `Finished ingest -- Run time: ${(endTime.getTime() - startTime.getTime()) /
      1000} seconds`
  );

  process.exit();
});
