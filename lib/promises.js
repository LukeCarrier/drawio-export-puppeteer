function handleRejection(action) {
  return function(e) {
    console.error(`${action} failed with`, e);
  };
}

module.exports = {
  handleRejection,
};
