import mongoose from 'mongoose';

const ErrorSchema = new mongoose.Schema({
  projectId: {
    type: String,
  },
  projectName: {
    type: String,
  },
  error: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: Object,
  },
});

const ProjectError = mongoose.model('ProjectError', ErrorSchema);
export default ProjectError;
