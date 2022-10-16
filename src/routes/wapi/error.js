import express from 'express';
import {searchError} from 'controllers/error';
import {protect} from 'middleware/auth';

const router = express.Router();

router.use(protect);
router.route('/search').post(searchError);

export default router;
