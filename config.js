module.exports = {
  dbUrl: "mongodb://localhost:27017/", // MongoDB url

  dbName: "mmm-ingest", // MongoDB database name

  httpsDelay: 0, // Throttle the https requests to avoid DOS'ing the dev's server

  limit: 70, // how many creators can be updated in under a minute
};
