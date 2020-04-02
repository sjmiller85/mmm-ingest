const api = require("./api");

const getCreatorsFromArray = arr => {
  const ids = arr.map(e => {
    return e.user;
  });
  return ids.filter((id, index) => ids.indexOf(id) === index);
};

const handleError = err => {
  console.log(err);
  process.exit();
};

module.exports = {
  api,
  getCreatorsFromArray,
  handleError
};
