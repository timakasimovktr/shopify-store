export const stringToHtml = (str) => {
  var parser = new DOMParser();
  var doc = parser.parseFromString(str, 'text/html');
  return doc.body.firstChild;
};

export const stringToPrice = (stringNumber) => {
  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formatter.format(stringNumber);
};

export const priceToFloat = (priceString) => {
  let floatResult = parseFloat(priceString.replace('$', '').replace(',', ''));
  return floatResult;
};

export const warrantyPriceToFloat = (priceString) => {
  const regex = /^\$([0-9]+(\.[0-9]{1,2})?)$/; // matches anything inside parentheses
  const match = priceString.match(regex);
  if (match && match[1]) {
      const floatString = match[1].replace('$', '').replace(',', '');
      return parseFloat(floatString);
  }

  return 0;
}
