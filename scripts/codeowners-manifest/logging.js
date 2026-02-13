'use strict';

function logCodeownersInfo(message, context) {
  if (context) {
    console.log(message, context);
    return;
  }
  console.log(message);
}

function logCodeownersError(message, context) {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}

module.exports = {
  logCodeownersInfo,
  logCodeownersError,
};
