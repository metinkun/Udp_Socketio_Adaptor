import ProjectError from 'models/Error';
import {search} from 'helpers/filterParser';
import {userRole} from 'enums/user';
import ErrorResponse from 'helpers/errorResponse';
import errors from 'enums/errors';

const searchTextFields = ['projectName', 'error'];
const adminFields = [];
const defaultProjection = ['shortId', 'projectName', 'error', 'user', 'createdAt', ...adminFields];

export const createError = (err, user) => {
  const {firstName, lastName, createdAt} = user?.profile || {};
  const {_id} = user || 0;
  const newErr = new ProjectError({
    projectName: 'Blended Business',
    error: err,
    user: {
      _id,
      firstName,
      lastName,
      createdAt,
    },
  });
  newErr.save();
  return;
};

export const searchError = async (req, res) => {
  const filter = req.body.filter || {};

  if (req.user.role === userRole.ADMIN) res.send(await search(req.user, ProjectError, searchTextFields, filter, defaultProjection, adminFields));
  else throw new ErrorResponse(errors.UN_AUTHORIZED);
};
