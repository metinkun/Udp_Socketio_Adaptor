import jwt from 'jsonwebtoken';
import User from 'models/User';
import errors from 'enums/errors';
import ErrorResponse from 'helpers/errorResponse';

// Protect routes
export const protect = async (req, res, next) => {
  let token;
  const {authorization} = req.headers;

  if (authorization && authorization.startsWith('Bearer ')) {
    token = authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) throw new ErrorResponse(errors.UN_AUTHORIZED);

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const sessionUser = await User.findById(decoded.id).exec();

    if (sessionUser.status !== 'active') {
      throw new ErrorResponse(errors.USER_NOT_ACTIVE);
    }
    req.user = sessionUser.toObject();

    next();
  } catch (err) {
    throw new ErrorResponse(errors.UN_AUTHORIZED);
  }
};

// TODO: Burayı inceleyelim METİN
export const apiProtect = async (req, res, next) => {
  const {auth} = req.headers;

  let apiKey;
  let secretKey;

  if (auth && auth.startsWith('Basic ')) {
    apiKey = auth.split(':')[0];
    secretKey = auth.split(':')[1];
  }

  // Make sure token exists
  if (!apiKey || !secretKey) {
    throw new ErrorResponse(errors.UN_AUTHORIZED);
  }

  try {
    const apiUser = await User.findOne({apiKey, secretKey});
    req.user = apiUser;
    next();
  } catch (error) {
    throw new ErrorResponse(errors.UN_AUTHORIZED);
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ErrorResponse(errors.UN_AUTHORIZED);
    }
    next();
  };
};
