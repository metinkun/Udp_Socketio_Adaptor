const mongoose = require('mongoose');
const mongooseDb = require('mongoose');

module.exports = async () => {
  const {DB_HOST} = process.env;

  const conn = await mongoose.connect(DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    autoReconnect: true,
  });

  const connErrDB = await mongooseDb.connect(DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};
