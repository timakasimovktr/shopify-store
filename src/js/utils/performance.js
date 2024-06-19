export const waitObjectProperty = (prop, parent = window, timeout = 5_000) => (
  new Promise((resolve, reject) => {
    const delay = 50;
    let retries = 0;

    const start = Date.now();
    const check = () => {
      if (parent.hasOwnProperty(prop)) {
        return resolve(parent[prop]);
      }
      if (Date.now() > start + timeout) {
        return reject(`Cannot find property ${prop} of ${parent}`);
      }
      setTimeout(check, delay * ++retries);
    };
    check();
  })
);

export function debounce(func, wait, immediate) {
  var timeout;
  return function() {
   var context = this, args = arguments;
   clearTimeout(timeout);
   if (immediate && !timeout) func.apply(context, args);
   timeout = setTimeout(function() {
    timeout = null;
    if (!immediate) func.apply(context, args);
   }, wait);
  };
}

export async function fetchWithProperty(url, body, propertyName, maxAttempts = 10, delayMs = 1000, callback) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (Boolean(data[propertyName])) {
        return data;
      } else {
        await new Promise(resolve => setTimeout(resolve, delayMs)); // Adding delay before the next attempt
        attempts++;
      }
    } catch (error) {
      throw new Error("Error fetching data: " + error.message);
    }
  }
  if (callback && attempts >= maxAttempts) {
    callback();
  }

  return null;
}