const express = require('express');

const config = require('./config');

const app = express();

const http = require('http').createServer(app);

config.initModules.forEach((init) => require(`./init/${init}`)(app, http));
config.middlewareModules.forEach((mw) => require(`./middleware/${mw}`).default(app, http));
config.services.forEach((mw) => require(`./services/${mw}`).default(app, http));
