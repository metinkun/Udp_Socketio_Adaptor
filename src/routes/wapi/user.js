import express from 'express';
import {
  getUser,
  updateUser,
  deleteUser,
  searchUser,
  // createUser,
  // updateUser,
  // deleteUser,
  // getUserProfile,
  // updateUserProfile,
  // deleteUserProfile
} from 'controllers/user';

const router = express.Router({mergeParams: true});

// const advancedResults = require("../middleware/advancedResults");
import {protect} from 'middleware/auth';

router.use(protect);

router.route('/search').post(searchUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);
router.route('/').get(getUser).put(updateUser);

export default router;
