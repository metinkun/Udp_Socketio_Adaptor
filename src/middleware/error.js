const errorHandler = require('utils/errorHandler').default;

export default async (app) => {
  app.use(errorHandler);
};
