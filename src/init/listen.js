// const { PORT, NODE_ENV } = process.env
const errorHandler = require('../utils/errorHandler.js').default;

module.exports = async (app, http) => {
  // app.listen(PORT, () =>
  //   console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`)
  // ),

  const {PORT, NODE_ENV} = process.env;

  http.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });

  //Catch uncaught exceptions
  process.on('uncaughtException', function (err) {
    // handle the error safely
    console.log(err);

    errorHandler(err);
  });
};
