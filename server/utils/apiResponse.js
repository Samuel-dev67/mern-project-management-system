/**
 * Sends a consistently-shaped success response across the entire API,
 * so the frontend can rely on one envelope shape everywhere:
 * { success, message, data }
 */
const sendResponse = (res, statusCode, message, data = null) => {
  const payload = { success: true, message };

  if (data !== null) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

module.exports = sendResponse;
