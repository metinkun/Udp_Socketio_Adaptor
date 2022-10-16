import errors, {errorPriorities} from 'enums/errors';
import {createError} from 'controllers/error';
const ErrorResponse = require('helpers/errorResponse');
let lastErrorString = '';
let lastErrorMillis = 0;
const errorHandler = (err, req, res, next) => {
  if (!err.priority) err.priority = errorPriorities.High;
  let error = {...err};

  error.message = err.message;

  // Log to console for dev

  // const errObj = err.toJSON();
  const errString = JSON.stringify(err);

  // console.log('ERROR HANDLER');
  // console.log(errObj);
  // console.log('err stack', err.stack);
  // console.log('req.user', req?.user);

  if (lastErrorString !== errString || Date.now() - lastErrorMillis > 5000) {
    createError(err, req?.user);
    lastErrorString = errString;
    lastErrorMillis = Date.now();
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ErrorResponse(errors.CAST_ERROR, err.message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = new ErrorResponse(errors.DUPLICATION, err.message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = new ErrorResponse(errors.VALIDATION_ERROR, err.message);
  }
  console.log('ERROR HANDLER');

  console.log(error);

  if (res) {
    res.status(error.statusCode || 500).json({
      error: {message: error.message || 'Server Error', code: error.code || 0},
    });
  }
};

export default errorHandler;
