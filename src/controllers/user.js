import User from 'models/User';
import {search} from 'helpers/filterParser';
import {userRole} from 'enums/user';
import ErrorResponse from 'helpers/errorResponse';
import errors from 'enums/errors';

import mongoose from 'mongoose';
import {generatePublicUser, IsEqualID} from 'helpers/auth';

const searchTextFields = ['email', 'phone'];
const adminFields = [];
const defaultProjection = ['shortId', 'email', 'apiKey', 'secretKey', 'role', 'status', 'createdAt', 'modifiedAt', ...adminFields];
const lookupInfo = [
  {
    from: 'companies',
    localField: 'companyId',
    foreignField: '_id',
    as: 'company',
    isSingle: true,
  },
  {
    from: 'warehouses',
    localField: 'wareHouseId',
    foreignField: '_id',
    as: 'wareHouse',
    isSingle: true,
  },
  {
    from: 'branches',
    localField: 'branchId',
    foreignField: '_id',
    as: 'branch',
    isSingle: true,
  },
];

// @desc      Get single user
// @route     GET /api/v1/auth/users/:id
// @access    Private/Admin
export const getUser = async (req, res) => {
  let _id = req.body.id || req.params.id || 0;
  if (!_id) _id = req.user._id;
  res.send(await getFullUser(_id, req.user));
};

export const createUser = async (newUser, session) => {
  const existingUser = await User.findOne({email: newUser.email}).lean();
  if (existingUser?._id) throw new ErrorResponse(errors.EMAIL_EXIST);
  const user = new User(newUser);
  let sessionObj;
  if (session) sessionObj = {session};
  return await user.save(sessionObj);
};
/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export const updateUser = async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {new: true}).lean();

  res.send(updatedUser);
};

export const updateBalances = async (userId, balances) => {
  await User.findByIdAndUpdate(userId, {balances});
};

export const deleteUser = async (req, res) => {
  const {id} = req.params;

  const deletedUser = await User.findByIdAndUpdate(id, {isDeleted: true, status: 'passive'}, {new: true});

  res.send(deletedUser);
};

export const searchUser = async (req, res) => {
  const filter = req.body.filter || {};
  if (!filter.fields) filter.fields = [];

  switch (req.user.role) {
    case userRole.ADMIN:
    case userRole.DEVELOPER:
      break;
    case userRole.COMPANY_OWNER:
      filter.fields.push({condition: 'equal', value: req.user.companyId, dataField: 'companyId'});
      break;
    case userRole.COMPANY_USER:
      return;
    case userRole.API_USER:
      return;
    case userRole.WORKER:
      return;
    default:
      return;
  }

  filter.fields.push({condition: 'not_equal', value: true, dataField: 'isDeleted'});

  const result = await search(req.user, User, searchTextFields, filter, defaultProjection, adminFields, lookupInfo);
  res.send(result);
};

export const getFullUser = async (_id, reqUser) => {
  if (_id === reqUser._id || reqUser.role === userRole.ADMIN || reqUser.role === userRole.COMPANY_OWNER) {
    const user = await User.aggregate([
      {$match: {_id: {$eq: mongoose.Types.ObjectId(_id)}}},
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $unwind: {
          path: '$company',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'wareHouseId',
          foreignField: '_id',
          as: 'wareHouse',
        },
      },
      {
        $unwind: {
          path: '$wareHouse',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]).exec();
    if (!user[0]) throw new ErrorResponse(errors.RECORD_NOT_FOUND);
    return generatePublicUser(user[0]);
  } else {
    throw new ErrorResponse(errors.UN_AUTHORIZED);
  }
};
