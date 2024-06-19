export const generateRandomId = (randomResultLength = 8) => {
  const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var randomId = '', charactersLength = CHARACTERS.length;
  
  for ( var i = 0; i < randomResultLength; i++ ) {
    randomId += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return randomId;
};