const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const env = require('../config').env;

export default async (app) => {
  const {PUBLIC_FOLDER} = env;
  app.use(express.json({limit: '50MB'}));
  app.use(express.static(path.join(__dirname, PUBLIC_FOLDER)));
  app.use(bodyParser.json());
};
