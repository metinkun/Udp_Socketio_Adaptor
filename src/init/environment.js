const dotenv = require('dotenv');

module.exports = async () => {
  dotenv.config({path: './src/config/config.env'});
};
