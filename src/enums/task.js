export const taskTypes = {
  AXIOS: 'axios',
  PUPPETEER: 'puppeteer',
};

export const taskStatus = {
  NEW: 'new',
  STARTING: 'starting',
  STARTED: 'started',
  CANCELLED: 'cancelled',
  FINISHED: 'finished',
};

export const taskResponseStatus = {
  SUCCESS: 'success',
  REQUEST_ERROR: 'requestError',
};

Object.freeze(taskTypes);
Object.freeze(taskStatus);
Object.freeze(taskResponseStatus);
