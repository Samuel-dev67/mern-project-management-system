/**
 * Centralized authorization helpers shared between the project and task
 * controllers. Pulled out here instead of duplicated in each controller
 * because "can this user touch this project" is asked in half a dozen
 * places and the rule must stay identical everywhere it's enforced.
 */

/**
 * True if the user is an admin, the project's creator, or listed as
 * a member of the project. This is the baseline "can view / interact
 * with this project at all" check.
 */
const hasProjectAccess = (project, user) => {
  if (user.role === 'admin') return true;
  if (project.createdBy.toString() === user._id.toString()) return true;
  return project.members.some(
    (memberId) => memberId.toString() === user._id.toString()
  );
};

/**
 * True only for admins and the project's creator. Used for destructive
 * or structural actions: edit project, delete project, manage members,
 * create/edit/delete tasks within the project.
 */
const isProjectOwnerOrAdmin = (project, user) => {
  if (user.role === 'admin') return true;
  return project.createdBy.toString() === user._id.toString();
};

/**
 * True for admins, the project owner, or the user a task is assigned
 * to. Used specifically for the lightweight status-update endpoint,
 * since team members need to be able to drag their own tasks across
 * the board without being full project owners.
 */
const canUpdateTaskStatus = (project, task, user) => {
  if (user.role === 'admin') return true;
  if (project.createdBy.toString() === user._id.toString()) return true;
  return task.assignedTo && task.assignedTo.toString() === user._id.toString();
};

module.exports = { hasProjectAccess, isProjectOwnerOrAdmin, canUpdateTaskStatus };
