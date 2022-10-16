import {findTask, startNewTask, tasks} from 'lib/taskManager';
import {slaves} from 'services/botNet';

// @desc      Get single user
// @route     GET /api/v1/auth/users/:id
// @access    Private/Admin

export const getSlaves = async (req, res) => {
  const slaveData = slaves.map((el) => {
    const slave = {...el};
    delete slave.socket;
    return slave;
  });
  res.send(slaveData);
};

export const getTasks = async (req, res) => {
  res.send(tasks);
};

export const newTask = async (req, res) => {
  let result;
  if (Array.isArray(req.body)) result = req.body.map((el) => startNewTask(el));
  else result = startNewTask(req.body);
  res.send(result);
};
export const getTask = async (req, res) => {
  let result;
  if (Array.isArray(req.body?.taskId)) result = req.body.taskId.map((el) => findTask(el));
  else result = findTask(req.body?.taskId);
  res.send(result);
};
