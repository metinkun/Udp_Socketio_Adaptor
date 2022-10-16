import express from 'express';

import {
  register,
  login,
  logout,
  getMe,
  resetPassword,
  // autoResetPassword,
  // manualResetPassword,
  forgotPassword,
  updateProfile,
  updatePassword,
  updateEmail,
  verifyEmail,
  confirmEmail,
  updateProfilePicture,
  updatePhone,
  verifyPhone,
  confirmPhone,
  getProfile,
  getPhone,
  getEmail,
  deleteProfilePicture,
  refreshToken,
  verifyIdentity,
  verifyIdentityCallback,
} from 'controllers/account';

const router = express.Router();

import {protect} from '../../middleware/auth';

router.route('/auth[:]signup').post(register);
router.route('/auth[:]signin').post(login);
router.route('/auth[:]signout').post(logout);
router.route('/auth[:]refresh').post(protect, refreshToken);

router.route('/').get(protect, getMe);

router.route('/password').put(protect, updatePassword);
router.route('/password[:]forgot').post(forgotPassword);
router.route('/password[:]reset').post(resetPassword);
// r.route('/password[:]auto-reset').post(autoResetPassword)
// r.route('/password[:]manual-reset').post(manualResetPassword)

router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.route('/profile/picture').put(protect, updateProfilePicture).delete(protect, deleteProfilePicture);

router.route('/phone').get(protect, getPhone).put(protect, updatePhone);
router.route('/phone[:]verify').post(protect, verifyPhone);
router.route('/phone[:]confirm').post(protect, confirmPhone);

router.route('/email').get(protect, getEmail).put(protect, updateEmail);
router.route('/email[:]verify/:via').post(protect, verifyEmail);
router.route('/email[:]confirm/:token?').get(confirmEmail).post(confirmEmail);

// router.route('/settings').get(protect, getSettings).put(protect, updateSettings);

// router.route('/verifications').get(protect, getVerifications);
router.route('/verifications/identity:verify').post(protect, verifyIdentity);
router.route('/verifications/identity:verify-callback').get(verifyIdentityCallback).post(verifyIdentityCallback);

export default router;
