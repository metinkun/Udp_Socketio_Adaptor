const helmet = require('helmet');

export default async (app) => {
  app.use(helmet());
};
