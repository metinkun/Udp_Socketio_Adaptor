import util from 'util';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
// import twilio from 'twilio';

import config from '../config';
import ErrorResponse from 'helpers/errorResponse';
import mailer from 'utils/mailer';
// import shuftiPro from 'utils/shuftiPro';
import User from 'models/User';
import phoneHelper from 'helpers/phone';

import {generatePublicUser} from 'helpers/auth';
import errors from 'enums/errors';
import {createUser} from './user';

// @desc      Register user
// @route     POST /api/v1/account/auth:signup
// @access    Public
export const register = async (req, res) => {
  const {email, password} = req.body;
  const existingUser = await User.findOne({email}).lean();
  if (existingUser?._id) throw new ErrorResponse(errors.EMAIL_EXIST);

  const user = await createUser({
    email,
    password,
  });

  sendTokenResponse(user, 200, res);
};

// @desc      Login user
// @route     POST /api/v1/account/auth:signin
// @access    Public
export const login = async (req, res) => {
  const {email, password} = req.body;

  // Validate emil & password
  if (!email || !password) {
    throw new ErrorResponse(errors.INVALID_OR_MISSING_PROPERTY, 'email or password is missing');
  }

  // Check for user
  const user = await User.findOne({email}).select('+password');

  if (!user) {
    throw new ErrorResponse(errors.WRONG_PASSWORD);
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ErrorResponse(errors.WRONG_PASSWORD);
  }

  if (user.status === 'passive') {
    throw new ErrorResponse(errors.USER_NOT_ACTIVE);
  }

  sendTokenResponse(user, 200, res);
};

// @desc      Refresh user token
// @route     POST /api/v1/account/auth:refresh
// @access    Private
export const refreshToken = async (req, res) => {
  // const user = await User.findById(req.user._id);
  sendTokenResponse(req.user, 200, res);
};

// @desc      Log user out / clear cookie
// @route     GET /api/v1/account/auth:signout
// @access    Private
export const logout = async (req, res) => {
  // res.cookie("token", "none", {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });

  res.status(200).json({
    success: true,
    message: 'user has been logged out',
  });
};

// @desc      Get current logged in user
// @route     GET /api/v1/account
// @access    Private
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.send(user);
};

function generateProfilePicFilename(userId, fileName) {
  return `${userId}__${Date.now()}${path.extname(fileName)}`.toLowerCase(); // e.g. 5eaaab8a2c34f832dc3785f1_1588271407808.png
}

export const updateProfilePicture = async (req, res) => {
  let newProfilePic;

  const upload = multer({
    storage: multer.diskStorage({
      destination: process.env.PROFILE_PICTURE_UPLOAD_PATH,
      filename: (req, file, cb) => {
        newProfilePic = generateProfilePicFilename(req.user._id, file.originalname);
        cb(null, newProfilePic);
      },
    }),
  }).single('profilepicture');

  const uploadPromise = util.promisify(upload);

  await uploadPromise(req, res);

  const user = await User.findById(req.user._id);

  user.profile.profilePicture = newProfilePic;

  await user.save();

  res.json({success: true, data: user});
};

export const deleteProfilePicture = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.profile.profilePicture = undefined;

  await user.save();

  res.json({success: true, message: 'Profile Picture removed', data: user});
};

// @desc      Update user profile
// @route     PUT /api/v1/account/profile
// @access    Private
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  const {profile} = user;

  const {body} = req;

  const {firstName, lastName, dateOfBirth, occupation, about, spokenLanguages, country, region} = body;

  if ('firstName' in body) {
    profile.firstName = firstName || '';
  }

  if ('lastName' in body) {
    profile.lastName = lastName || '';
  }

  if ('dateOfBirth' in body) {
    profile.dateOfBirth = new Date(dateOfBirth);
  }

  if ('occupation' in body) {
    profile.occupation = occupation;
  }

  if ('about' in body) {
    profile.about = about;
  }

  if ('country' in body) {
    profile.country = country;
  }

  if ('region' in body) {
    profile.region = region;
  }

  if ('spokenLanguages' in body) {
    profile.spokenLanguages = spokenLanguages;
  }

  profile.isUpdated = true;
  user.verifications.profile = true;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: user.profile,
  });
};

// @desc      Update password
// @route     PUT /api/v1/account/password
// @access    Private
export const updatePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  const {currentPassword, newPassword} = req.body;

  if (!currentPassword || !newPassword) {
    throw new ErrorResponse(errors.WRONG_PASSWORD);
  }

  // Check current password
  if (!(await user.matchPassword(currentPassword))) {
    throw new ErrorResponse(errors.WRONG_PASSWORD);
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// @desc      Forgot password
// @route     POST /api/v1/account/password:auto-reset
// @access    Public
export const autoResetPassword = async (req, res, next) => {
  const user = await User.findOne({email: req.body.email});

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  const tempPass = Math.floor(10000000 + Math.random() * 90000000).toString();

  user.password = tempPass;

  await user.save();

  try {
    await mailer.sendMail('auto-reset-password', {email: user.email, name: user.fullName}, {fullName: 'Ismet Togay', tempPassword: tempPass});

    res.status(200).json({success: true, message: 'Email sent'});
  } catch (err) {
    console.log(err);
    return next(new ErrorResponse('Email could not be sent', 500));
  }
};

// @desc      Forgot password
// @route     POST /api/v1/account/password:reset
// @access    Public
export const resetPassword = async (req, res, next) => {
  const {_id, password} = req.body;
  const user = await User.findById(_id).select('+password');

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  if (!password) {
    return next(new ErrorResponse('Missing password', 404));
  }

  user.password = password;

  await user.save();

  res.json({
    success: true,
    message: 'Password has been reset',
  });
};

// @desc      Forgot password 2
// @route     POST /api/v1/account/password:forgot
// @access    Public
export const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({email: req.body.email});

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  const verifyVia = {code: true};
  const secret = user.getVerifyEmailSecret(verifyVia);

  await user.save({validateBeforeSave: false});

  const mailTo = {email: user.email, name: user.fullName};
  const mailType = 'verify-email-via-code';
  const mailParams = {emailVerifyCode: secret};
  mailParams.fullName = user.fullName;

  try {
    await mailer.sendMail(mailType, mailTo, mailParams);

    res.json({
      success: true,
      message: 'Verification Email has been sent.',
      data: {
        _id: user._id,
      },
    });
  } catch (err) {
    console.log(err);

    user.verifyEmailToken = undefined;
    user.verifyEmailExpire = undefined;

    await user.save({validateBeforeSave: false});

    return next(new ErrorResponse('Email could not be sent', 500));
  }
};

// @desc      Reset password
// @route     POST /api/v1/account/password:manual-reset
// @access    Public
export const manualResetPassword = async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {$gt: Date.now()},
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// @desc      Update phone
// @route     PUT /api/v1/account/phone
// @access    Private
export const updatePhone = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const oldPhone = user.phone;
  const newPhone = req.body.phone;

  if (newPhone === oldPhone && !config.excludedPhones.includes(newPhone)) {
    return next(new ErrorResponse('New number cannot be same as the old number', 400));
  } else {
    const isPhoneValidated = await phoneHelper.validatePhoneNumber(newPhone);

    if (!isPhoneValidated) {
      return next(new ErrorResponse('Invalid Phone Number', 400));
    }

    user.phone = newPhone;
    user.verifications.phone = false;
    await user.save();
    module.exports.verifyPhone(req, res, next);
  }
};

// @desc      Verify phone
// @route     POST /api/v1/account/phone:verify
// @access    Private
export const verifyPhone = async (req, res, next) => {
  // const user = await User.findById(req.user._id);
  // const verifyCode = user.getVerifyPhoneCode();
  // user.verifications.phone = false;
  // await user.save({validateBeforeSave: false});
  // const {TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER} = process.env;
  // const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
  //   lazyLoading: true,
  // });
  // const message = `
  //   Hey ${user.fullName}!\n\n
  //   Your GETLUG code is: ${verifyCode}
  // `;
  // try {
  //   const msg = await twilioClient.messages.create({
  //     from: TWILIO_PHONE_NUMBER,
  //     to: user.phone,
  //     body: message,
  //   });
  //   return res.json({
  //     success: true,
  //     message: 'sms sent',
  //     data: {success: true, data: {messageSid: msg.sid}},
  //   });
  // } catch (err) {
  //   console.log(err);
  //   user.verifyPhoneCode = undefined;
  //   user.verifyPhoneExpire = undefined;
  //   await user.save({validateBeforeSave: false});
  //   return next(new ErrorResponse('SMS could not be sent', 500));
  // }
};

// @desc      Confirm phone via sms code
// @route     POST /api/v1/account/phone:confirm
// @access    Private
export const confirmPhone = async (req, res, next) => {
  const verifyPhoneCode = req.body.code;

  const userEntity = req.user || req.body;

  const user = await User.findOne({
    _id: userEntity._id,
    verifyPhoneCode,
    verifyPhoneExpire: {$gt: Date.now()},
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or Expired code', 400));
  }

  // Set new password
  user.verifications.phone = true;
  user.verifyPhoneCode = undefined;
  user.verifyPhoneExpire = undefined;
  await user.save();

  res.json({success: true, message: 'Phone Number Confirmed'});
};

// @desc      Update email
// @route     PUT /api/v1/account/email
// @access    Private
export const updateEmail = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const oldEmail = user.email;
  const newEmail = req.body.email;

  if (!newEmail) {
    return next(new ErrorResponse('New email address missing', 400));
  }

  const userWithNewEmail = await User.findOne({email: newEmail});

  if (userWithNewEmail || newEmail === oldEmail) {
    return next(new ErrorResponse('User with that email already exists', 400));
  }

  user.email = newEmail;
  user.verifications.email = false;
  await user.save();

  res.json({success: true, message: 'Email updated'});
};

// @desc      Verify email via code or token
// @route     POST /api/v1/account/email:verify
// @access    Private
export const verifyEmail = async (req, res, next) => {
  let verifyVia = req.params.via;

  if (!verifyVia || !['code', 'token'].includes(verifyVia.toLowerCase())) {
    return next(new ErrorResponse("Via method must be 'code' or 'token'", 400));
  }

  verifyVia = {};
  verifyVia[req.params.via] = true;

  const email = req.user ? req.user.email : req.body.email;

  if (!email) {
    return next(new ErrorResponse('There is no email defined for this user', 404));
  }

  const user = await User.findOne({email});

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token or code
  const secret = user.getVerifyEmailSecret(verifyVia);

  await user.save({validateBeforeSave: false});

  const mailTo = {email: user.email, name: user.fullName};
  const mailType = verifyVia.token ? 'verify-email-via-link' : 'verify-email-via-code';
  const mailParams = verifyVia.token ? {emailVerifyToken: secret} : {emailVerifyCode: secret};
  mailParams.fullName = user.fullName;

  try {
    await mailer.sendMail(mailType, mailTo, mailParams);

    if (!req.isNewUser) {
      res.json({
        success: true,
        message: `Verify Email via ${req.params.via} has been sent.`,
      });
    }
  } catch (err) {
    console.log(err);

    user.verifyEmailToken = undefined;
    user.verifyEmailExpire = undefined;

    await user.save({validateBeforeSave: false});

    return next(new ErrorResponse('Email could not be sent', 500));
  }
};

// @desc      Confirm email via code or token
// @route     POST /api/v1/account/email:confirm
// @access    Private
export const confirmEmail = async (req, res, next) => {
  const secret = req.body.code || req.params.token;

  if (!secret) {
    return next(new ErrorResponse('Invalid code/token', 400));
  }

  const query = {
    verifyEmailToken: secret,
    verifyEmailExpire: {$gt: Date.now()},
  };

  if (req.user) {
    query._id = req.user._id;
  }

  const user = await User.findOne(query);

  if (!user) {
    return next(new ErrorResponse('Invalid or Expired code/token', 400));
  }

  // Set new password
  user.verifications.email = true;
  user.verifyEmailToken = undefined;
  user.verifyEmailExpire = undefined;
  await user.save();

  res.json({success: true, message: 'Email address Confirmed'});
};

// @desc      Get profile
// @route     GET /api/v1/account/profile
// @access    Private
export const getProfile = async (req, res) => {
  const result = await User.findById(req.user._id).exec();
  // console.log(result)
  res.json({success: true, data: result.profile});
};

// @desc      Get phone number
// @route     GET /api/v1/account/phone
// @access    Private
export const getPhone = async (req, res) => {
  res.json({success: true, data: req.user.phone});
};

// @desc      Get email
// @route     GET /api/v1/account/email
// @access    Private
export const getEmail = async (req, res) => {
  res.json({success: true, data: req.user.email});
};

export const verifyIdentity = async (req, res, next) => {
  // const {imageBase64} = req.body;
  // const {user} = req;
  // const isVerified = await shuftiPro.verifyUserIdentity(imageBase64, user);
  // user.verifications.identity = isVerified;
  // await User.findByIdAndUpdate(user._id, {
  //   $set: {'verifications.identity': isVerified},
  // });
  // if (!isVerified) {
  //   return next(new ErrorResponse('Verification failed. Make sure that ID card data is readable and matches your profile info.', 400));
  // }
  // res.json({
  //   success: true,
  //   data: {
  //     isVerified,
  //   },
  // });
};

export const verifyIdentityCallback = async (req, res) => {
  // console.log('req.body')
  // console.log(req.body)
  // console.log('-----------')
  // console.log('req.params')
  // console.log(req.params)
  // console.log('-----------')
  res.json({success: true, message: 'verification callback called'});
};

// Get token from model and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // const options = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
  //   ),
  //   httpOnly: true,
  // };

  // if (process.env.NODE_ENV === "production") {
  //   options.secure = true;
  // }

  // .cookie("token", token, options)

  res.status(statusCode).json({
    success: true,
    token,
    user: generatePublicUser(user),
  });
};
