module.exports = {
    dbUrl: 'mongodb://localhost:27017/', // MongoDB url

    dbName: 'mmm-ingest', // MongoDB database name
    
    httpsDelay: 0, // Throttle the https requests to avoid DOS'ing the dev's server

    threshold: 43200000 // How long before records become stale and need to be updated, 6000 milliseconds = 1 minute
}