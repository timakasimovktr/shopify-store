export const onDocumentReady = (callback) => (document.readyState === "complete" || document.readyState === "interactive"
  ? setTimeout(callback, 1)
  : document.addEventListener("DOMContentLoaded", callback));