'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

const AUTH_URL = '/apps/kf-middleware/api/v1/synchrony',
STATUS_URL = '/apps/kf-middleware/api/v1/synchrony/status',
SYNCHRONY_MERCHANT_ID = '5348121670000072';

/* --------------- Control & Logic --------------- */

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

/**
 * Authenticates on server and gets token.
 * 
 * @param {*} synchronyModalClosedCallback 
 * @returns 
 */
async function initAuth(synchronyModalClosedCallback){
  let authInfo = await authenticateAndGetToken(),
  synchronyData = new SynchronyData(SYNCHRONY_MERCHANT_ID, getTransactionId(), authInfo.postBackId, authInfo.clientToken, new SynchronyParameters());

  setupModalCloseEvent(synchronyModalClosedCallback);

  synchronyData.parameters = getCheckoutInfo(synchronyData);

  return synchronyData;
}

/**
 * This function empties the parameters but populates
 * the values from authenticateAndGetToken obtained before.
 */
function reset(synchronyData){
  let newSynchronyData = new SynchronyData(synchronyData.merchantId, synchronyData.transactionId, synchronyData.postBackId, synchronyData.clientToken, new SynchronyParameters());

  synchronyData.parameters = getCheckoutInfo(synchronyData);

  return newSynchronyData;
}

function setupModalCloseEvent(synchronyModalClosedCallback) {
  window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data === 'Close Model') {
      synchronyModalClosedCallback();
    }
  });
}

async function authenticateAndGetToken() {
  let response = await (await fetch(AUTH_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).catch((err) => {
    console.error(err);
  })).json();

  return new AuthenticationInfo(response.postbackid, response.clientToken);
}

/**
* Launches Synchrony Modal
*/
function launchConsumerModal(synchronyData) {
  let synchronyParameters = getSynchronyParameters(synchronyData);
  window.syfDBuy.calldBuyProcess(null, synchronyParameters);
}

/* --------------- Utils & Tools --------------- */

/**
 * Prepares and maps info for
 * the Synchrony Modal.
 * 
 * @param {*} synchronyData 
 * @returns 
 */
function getSynchronyParameters(synchronyData){
  let modalObject = {}, synchronyFieldName = '';
  
  Object.getOwnPropertyNames(synchronyData.parameters).forEach((propName) => {
    synchronyFieldName = synchronyData.parameters[propName].synchronyFieldName;
    if(synchronyFieldName){
      modalObject[synchronyFieldName] = synchronyData.parameters[propName].value;
    }
  });
  
  return modalObject;
}

/**
 * Gets info from shopify checkout
 * to synchrony data.
 * 
 * @param {*} synchronyData 
 * @returns 
 */
function getCheckoutInfo(synchronyData){
  let shopifyFieldName = '';
  
  Object.getOwnPropertyNames(synchronyData.parameters).forEach((propName) => {
    if(synchronyData.parameters[propName].shopifyFieldName){
      shopifyFieldName = synchronyData.parameters[propName].shopifyFieldName;
      synchronyData.parameters[propName].value = window.LC?.checkout[shopifyFieldName];
    }
  });
  
  return synchronyData.parameters;
}

function getTransactionId(){
  const pathParts = window.location.pathname.split('/checkouts/');
  return pathParts[pathParts.length - 1];
}

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  
  /* --------------- Events Setup --------------- */
  
  /* --------------- Initialization--------------- */
  
  
  /* --------------- Window Export --------------- */
}

/**
* Watches for synchrony modal status (cancel, confirm, close)
*/
async function onSynchronyModalClosed(synchronyData, synchronyModalClosedCallback) {
  const synchronyParams = getSynchronyParameters(synchronyData),
  token = { userToken: `${ synchronyParams.tokenId }` };
  
  await fetch(STATUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token),
  }).then(res => res.json()).then(synchronyModalClosedCallback).catch((err) => {
    console.error(err);
    synchronyModalClosedCallback();
  });
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

class SynchronyData {
  merchantId;
  transactionId;
  postBackId;
  clientToken;
  parameters;
  
  constructor(merchantId = null, transactionId = null, postBackId = null, clientToken = null, parameters = new SynchronyParameters()){
    this.merchantId = merchantId;
    this.transactionId = transactionId;
    this.postBackId = postBackId;
    this.clientToken = clientToken;
    this.parameters = parameters;

    //

    this.parameters.merchantId.value = merchantId;
    this.parameters.transactionId.value = transactionId;
    this.parameters.postBackId.value = postBackId;
    this.parameters.clientToken.value = clientToken;
  }
}

class SynchronyParam {
  synchronyFieldName; // The name of the Synchrony field
  shopifyFieldName; // The name of the Shopify window.LC field
  orderAttributeField; // The name of the order attribute field
  value;
  manual; // is manual setup

  constructor(synchronyFieldName = '', shopifyFieldName = '', orderAttributeField = '', value = '', manual = false){
    this.synchronyFieldName = synchronyFieldName;
    this.shopifyFieldName = shopifyFieldName;
    this.orderAttributeField = orderAttributeField;
    this.value = value;
    this.manual = manual;
  }
}

class SynchronyParameters {
    firstName;
    lastName;
    address1;
    address2;
    city;
    state;
    zipCode;
    email;
    offerCode;
    amount;
    clientToken;
    merchantId;
    processIndicator;
    transactionId;
    postBackId;
    statusCode;
    statusMessage;
    accountNumber;
    authCode;

  constructor(){
    this.firstName = new SynchronyParam('custFirstName', 'firstName');
    this.lastName = new SynchronyParam('custLastName', 'lastName');
    this.address1 = new SynchronyParam('custAddress1', 'address1');
    this.address2 = new SynchronyParam('custAddress2', 'address2');
    this.city = new SynchronyParam('custCity', 'city');
    this.state = new SynchronyParam('custState', 'state');
    this.zipCode = new SynchronyParam('custZipCode', 'zip');
    this.email = new SynchronyParam('emailAddress', 'email');
    this.offerCode = new SynchronyParam('transPromo1', '', 'transPromo1');
    this.amount = new SynchronyParam('transAmount1', '', 'transAmount1');
    this.clientToken = new SynchronyParam('tokenId', '', 'userToken');
    this.merchantId = new SynchronyParam('merchantID', '', '', '', true);
    this.processIndicator = new SynchronyParam('processInd', '', 'processInd', 3, true);
    this.transactionId = new SynchronyParam('clientTransId', '', 'clientTransId', '', true);
    this.postBackId = new SynchronyParam('', '', 'postbackId', '', true);
    this.statusCode = new SynchronyParam('', '', 'StatusCode', '', true);
    this.statusMessage = new SynchronyParam('', '', 'StatusMessage', '', true);
    this.accountNumber = new SynchronyParam('', '', 'AccountNumber', '', true);
    this.authCode = new SynchronyParam('', '', 'AuthCode', '', true);
  }
}

class AuthenticationInfo {
  postBackId;
  clientToken;

  constructor(postBackId, clientToken){
    this.postBackId = postBackId;
    this.clientToken = clientToken;
  }
}

////////// Exports //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export { 
  initAuth,
  reset,
  launchConsumerModal,
  onSynchronyModalClosed,

  SynchronyData,
  SynchronyParameters
};