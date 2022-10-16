import express from 'express';
import {getSlaves, getTasks, newTask,getTask} from 'controllers/bot';
import {protect} from 'middleware/auth';

const router = express.Router();

router.use(protect);
router.route('/slaves').get(getSlaves);
router.route('/tasks').get(getTasks);
router.route('/newTask').post(newTask);
router.route('/getTask').post(getTask);

// router.route('/:id').get(getBot).put(updateBot);
// router.route('/').post(createBot);

export default router;
