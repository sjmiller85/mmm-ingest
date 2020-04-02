const config = require("./config");
const utils = require("./utils");
const mongo = require("./mongo");
const ids = require("./ids");

mongo.connect(config.dbUrl, config.dbName, async () => {
  const creators = await mongo.models.creators
    .getAllCreators()
    .catch(utils.handleError);
  const levels = await mongo.models.levels
    .getAllLevels()
    .catch(utils.handleError);
  const analytics = await mongo.models.analytics
    .getAllAnalytics()
    .catch(utils.handleError);

  await mongo.models.icons.deleteAllIcons();

  console.log(`Migrating ${creators.length} creators`);
  for (let i = 0, ii = creators.length; i < ii; i++) {
    let creator = creators[i];
    await mongo.models.creators.deleteCreator(creator.id);

    if (typeof creator.admin === "undefined") {
      continue;
    }

    let avgScoreArr = creator.avgScore.map((e, i, arr) => {
      if (i === 0) {
        return {
          date: new Date(e.date),
          score: e.score.toFixed(2)
        };
      }
      if (i > 0 && e.score.toFixed(2) !== arr[i - 1].score.toFixed(2)) {
        return {
          date: new Date(e.date),
          score: e.score.toFixed(2)
        };
      }
    });

    avgScoreArr = avgScoreArr.filter(e => {
      if (e) return e;
    });

    let doc = {
      id: creator.id,
      name: creator.name,
      admin: creator.admin,
      icon: creator.icon,
      level_size: creator.level_size,
      score: creator.score,
      updated: new Date(creator.updated),
      avgScore: avgScoreArr,
      currentLevelSize: creator.currentLevelSize,
      currentScore: creator.currentScore,
      currentAvgScore: creator.currentAvgScore
    };

    await mongo.models.creators.addCreatorToDb(doc);
  }

  console.log("Finished migrating creators");
  console.log(`Migrating ${levels.length} levels`);

  for (let i = 0, ii = levels.length; i < ii; i++) {
    let e = levels[i];
    await mongo.models.levels.deleteLevel(e.id);

    const doc = {
      id: e.id,
      date: new Date(e.date),
      downloads: e.downloads,
      name: e.name,
      score: e.score,
      updated: new Date(e.updated),
      user: e.user,
      username: e.username,
      currentDownloads: e.currentDownloads,
      currentScore: e.currentScore,
      boss: e.boss,
      deleted: e.deleted
    };

    await mongo.models.levels.addLevelToDb(doc);
  }

  console.log("Finished migrating levels");
  console.log(`Migrating ${analytics.length} analytics`);

  await mongo.models.analytics.deleteAllAnalytics();

  for (let i = 0, ii = analytics.length; i < ii; i++) {
    let analytic = analytics[i];
    await mongo.models.analytics.addAnalytics({
      date: analytic.date,
      creators: analytic.creators,
      levels: analytic.levels
    });
  }

  console.log("Finished migrating analytics");

  process.exit();
});
