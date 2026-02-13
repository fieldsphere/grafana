'use strict';

function logE2eInfo(message, context) {
  if (context) {
    console.log(message, context);
    return;
  }
  console.log(message);
}

function logE2eWarning(message, context) {
  if (context) {
    console.warn(message, context);
    return;
  }
  console.warn(message);
}

function logE2eError(message, context) {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}

module.exports = {
  logE2eInfo,
  logE2eWarning,
  logE2eError,
};
