// const morgan = require("morgan");
const morganBody = require('morgan-body');

export default async (app) => {
  if (process.env.NODE_ENV === 'development') {
    // app.use(morgan("combined"));

    morganBody(app, {
      prettify: true,
      maxBodyLength: 1000000,
      timezone: 'Europe/Istanbul',
    });
  }
};
