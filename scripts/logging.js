'use strict';

function logScriptInfo(message, context) {
  if (context) {
    console.log(message, context);
    return;
  }
  console.log(message);
}

function logScriptWarning(message, context) {
  if (context) {
    console.warn(message, context);
    return;
  }
  console.warn(message);
}

function logScriptError(message, context) {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}

module.exports = {
  logScriptInfo,
  logScriptWarning,
  logScriptError,
};
