const axios = require("axios");

const run = async () => {
  const avatar = await axios
    .get(`https://megamanmaker.com/bot/bosses/2.png`)
    .catch(e => {
      return e.response;
    });
  console.log(avatar.status);
};

run();
