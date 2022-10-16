const path = require('path');

module.exports.initModules = ['environment', 'asyncWrapper', 'listen'];

module.exports.middlewareModules = ['helmet', 'language', 'express', 'cors', 'routes', 'logging', 'error', 'socket'];
module.exports.services = ['botNet'];

module.exports.wapiRoutes = [ 'bot'];

module.exports.supportedLanguages = ['tr', 'en', 'zn'];
module.exports.defaultLanguage = 'tr';

module.exports.folders = {
  root: path.join(__dirname, '..'),
};

module.exports.excludedPhones = ['+905302378814', '+905373112917'];

module.exports.env = process.env;
