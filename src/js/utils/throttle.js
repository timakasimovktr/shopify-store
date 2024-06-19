const throttle = (func, wait) => {
  let timeout = null;

  return (...args) => {
    if (timeout === null) {
      timeout = setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    }
  };
};

export default throttle;
