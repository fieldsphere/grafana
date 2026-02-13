'use strict';

function logWebpackInfo(message, context) {
  if (context) {
    console.log(message, context);
    return;
  }
  console.log(message);
}

function logWebpackError(message, context) {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}

module.exports = {
  logWebpackInfo,
  logWebpackError,
};
