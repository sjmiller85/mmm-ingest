const api = require("./api");
const fs = require("fs");

const getCreatorsFromArray = arr => {
  const ids = arr.map(e => {
    return e.user;
  });
  return ids.filter((id, index) => ids.indexOf(id) === index);
};

const handleError = err => {
  writeToLogFile(err);
  process.exit();
};

const writeToLogFile = msg => {
  const dateString = new Date().toLocaleDateString().replace(/\//g, "-");
  const timeString = new Date().toLocaleString();
  const fileName = `ingest.${dateString}.log`;

  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, "");
  }

  fs.appendFileSync(`ingest.${dateString}.log`, `${timeString}: ${msg}\n`);
};

module.exports = {
  api,
  getCreatorsFromArray,
  handleError,
  writeToLogFile
};
