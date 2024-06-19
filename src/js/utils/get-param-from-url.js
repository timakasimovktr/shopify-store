export default (paramKey) => {
  return new URLSearchParams(window.location.search).get(paramKey);
};