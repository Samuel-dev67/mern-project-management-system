const getId = (value) => {
  if (!value) return null;

  // If populated document
  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }

  // If plain ObjectId
  return value.toString();
};

const hasProjectAccess = (project, user) => {
  if (user.role === 'admin') return true;

  if (getId(project.createdBy) === user._id.toString()) {
    return true;
  }

  return project.members.some(
    (member) => getId(member) === user._id.toString()
  );
};

const isProjectOwnerOrAdmin = (project, user) => {
  if (user.role === 'admin') return true;

  return getId(project.createdBy) === user._id.toString();
};

const canUpdateTaskStatus = (project, task, user) => {
  if (user.role === 'admin') return true;

  if (getId(project.createdBy) === user._id.toString()) {
    return true;
  }

  return task.assignedTo && getId(task.assignedTo) === user._id.toString();
};

module.exports = {
  hasProjectAccess,
  isProjectOwnerOrAdmin,
  canUpdateTaskStatus,
};