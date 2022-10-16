import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ShortId from 'shortid';
import _ from 'lodash';
import {userRole} from '../enums/user';
const {ObjectId} = mongoose.Schema.Types;

const UserSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    default: ShortId.generate,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    set: (email) => _.toLower(email),
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    select: false,
  },
  status: {
    type: String,
    enum: ['active', 'passive'],
    default: 'active',
  },
  apiKey: {
    type: String,
    required: false,
    default: '',
  },
  secretKey: {
    type: String,
    required: false,
    default: '',
  },
  passphrase: {
    type: String,
    required: false,
    default: '',
  },
  balances: {type: Object, required: true, default: {}},
  logs: {type: Array, required: true, default: []},
  createdAt: {
    type: Date,
    default: Date.now,
  },
  creatorUser: {
    type: ObjectId,
    ref: 'User',
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
  modifierUser: {
    type: ObjectId,
    ref: 'User',
  },
});

// UserSchema.pre("findOne", function (next) {
//   this.populate("profile.spokenLanguages")
//     .populate("settings.language")
//     .populate("profile.country", "nameI18n");
//   next();
// });

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.modifiedAt = Date.now();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({id: this._id}, process.env.JWT_SECRET, {
    // expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

UserSchema.methods.getVerifyEmailSecret = function (verifyVia) {
  // Generate token
  const secret = verifyVia.code ? Math.floor(1000 + Math.random() * 9000).toString() : crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.verifyEmailToken = verifyVia.code ? secret : crypto.createHash('sha256').update(secret).digest('hex');

  const expireDateCode = new Date();
  expireDateCode.setMinutes(expireDateCode.getMinutes() + 3);

  const expireDateToken = new Date();
  expireDateToken.setDate(expireDateToken.getDate() + 3);

  // Set expire
  this.verifyEmailExpire = verifyVia.code ? expireDateCode : expireDateToken; // +3 minutes for code, +10days for token

  return this.verifyEmailToken;
};

UserSchema.methods.getVerifyPhoneCode = function () {
  // Generate token
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // Hash token and set to resetPasswordToken field
  this.verifyPhoneCode = code;

  // Set expire
  const expireDate = new Date();
  expireDate.setMinutes(expireDate.getMinutes() + 3);

  this.verifyPhoneExpire = expireDate; // Date.now() + 3 * 60000; //+3 minutes in millisecond

  return code;
};

UserSchema.virtual('fullName').get((value, virtual, doc) => {
  const firstName = doc.profile.firstName || '';
  const lastName = doc.profile.lastName || '';
  const fullName = (firstName + ' ' + lastName).trim();
  return fullName;
});

const User = mongoose.model('User', UserSchema);

export default User;
