module.exports = {
  dbUrl: "mongodb://localhost:27017/", // MongoDB url

  dbName: "mmm-ingest", // MongoDB database name

  httpsDelay: 0, // Throttle the https requests to avoid DOS'ing the dev's server

  threshold: 60 // How many minutes before docs go stale and need to be queued for update
};
