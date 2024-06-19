'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

import moment from 'moment';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

const GET_RATES_URL = '/apps/kf-middleware/api/v1/shipping/get-rates';
const GET_INDIVIDUAL_RATES_URL = '/apps/kf-middleware/api/v1/shipping/get-individual-rates';

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

async function getRates(data, individualItems){
  var fetchErrors = false;
  const controller = new AbortController(),
  timeoutId = setTimeout(() => controller.abort(), 10000);

  const raResponse = await (await fetch(!individualItems ? GET_RATES_URL : GET_INDIVIDUAL_RATES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: controller.signal
  }).catch((err) => {
    console.error(err);
    fetchErrors = true;
  })).json();

  clearTimeout(timeoutId);

  if(!fetchErrors){
    if(!individualItems){
      return [new RAResponse(groupDeliveryRates(raResponse.rates), raResponse.atpDate, raResponse.atpDateLines, raResponse.taxRuleID)];
    } else {
      let rateResponses = [];

      raResponse.forEach((raResponseEach) => {
        rateResponses.push(
          new RAResponse(groupDeliveryRates(raResponseEach.rates), raResponseEach.atpDate, raResponseEach.atpDateLines, raResponseEach.taxRuleID, raResponseEach.individualSku)
        );
      });

      return rateResponses;
    }
  }

  return ratesRes;
}

/* --------------- Utils & Tools --------------- */

function getRatesObjRequestModel(){
  return {
    rate: {
      origin: {
        country: "US",
        postal_code: "33781",
        province: "FL",
        city: "Pinellas Park",
        name: null,
        address1: "5700 70th Avenue North",
        address2: null,
        address3: null,
        phone: "727-545-9555",
        fax: null,
        email: null,
        address_type: null,
        company_name: "Kane's Furniture"
      },
      destination: {
        postal_code: '',
      },
      items: [],
      currency: "USD",
      locale: "en-US"
    }
  };
}

function getDeliveryDateOfRate(serviceCode, serviceName){
  var deliveryDateString, date, month, year, momentReturn;

  if(!serviceCode){
    return moment('1900-01-01');
  }
  
  if(serviceCode.includes('|')){
    serviceCode = serviceCode.split('|')[0];
  }

  // OUTOFSTATE_02_06_2022
  if(serviceCode.includes('OUTOFSTATE')){
    deliveryDateString = serviceCode.substring('OUTOFSTATE_'.length);
  }
  // D_21_06_2022
  else if(serviceCode.startsWith('D_')) {
    deliveryDateString = serviceCode.substring('D_'.length);
  } // SD_01_03_2049
  else if(serviceCode.startsWith('SD_')) {
    return false;
  }

  date = deliveryDateString.substring(0, 2);
  month = deliveryDateString.substring(3, 5);
  year = deliveryDateString.substring(6);

  momentReturn = moment(`${year}-${month}-${date}`);

  // Add 2 days when pickup
  if(serviceName.toLowerCase().includes('pickup')){
    momentReturn = momentReturn.add(2, 'days');
  }

  return momentReturn;
}

function groupDeliveryRates(rates){
  var deliveryRateGroups = [];

  // Group
  rates.forEach((rate) => {
    var newDeliveryRate = new DeliveryRate(rate.description, rate.service_code, rate.service_name, rate.total_price),
      serviceName = removeWorkdaysFromService(rate.service_name),
      existingDrGroup;
      
    existingDrGroup = deliveryRateGroups.find(drGroup => drGroup.serviceName == serviceName);

    if(!existingDrGroup){
      deliveryRateGroups.push(new DeliveryRateGroup(serviceName, rate.currency, [newDeliveryRate], rate.service_code, rate.zip_code, rate.zone_id));
    } else {
      existingDrGroup.rates.push(newDeliveryRate);
    }
  });

  // Order by delivery date asc
  deliveryRateGroups.forEach((drGroup) => {
    drGroup.rates = drGroup.rates.sort((rateA, rateB) => {
      return sortAscByDeliveryDate(rateA, rateB, 'serviceCode');
    });
  });

  window.deliveryRateGroups = deliveryRateGroups;

  return deliveryRateGroups;
}

function removeWorkdaysFromService(serviceName){
  if(serviceName.includes('(')){
    return serviceName.substring(0, serviceName.indexOf('('));
  }

  return serviceName;
}

function sortAscByDeliveryDate(rateA, rateB){
  return getDeliveryDateOfRate(rateA.serviceCode, rateA.completeServiceName).diff(getDeliveryDateOfRate(rateB.serviceCode, rateB.completeServiceName));
}

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  
  /* --------------- Events Setup --------------- */

  /* --------------- Initialization--------------- */
  
  
  /* --------------- Window Export --------------- */
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

class RAResponse {
  rateGroups;
  atpDate;
  atpDateLines;
  taxRuleID;
  individualSku;

  constructor(rateGroups, atpDate, atpDateLines, taxRuleID, individualSku = null){
    this.rateGroups = rateGroups;
    this.atpDate = atpDate;
    this.atpDateLines = atpDateLines;
    this.taxRuleID = taxRuleID;
    this.individualSku = individualSku;
  }
}

class DeliveryRateGroup {
	serviceName;
	currency;
	rates;

	constructor(serviceName, currency, rates, serviceCode, zipCode, zoneId){
		this.serviceName = serviceName;
    this.serviceCode = serviceCode;
    this.zipCode = zipCode,
    this.zoneId = zoneId,
		this.currency = currency;
		this.rates = rates;
	}
}

class DeliveryRate {
	description;
	serviceCode;
	completeServiceName;
	totalPrice;

	constructor(description, serviceCode, completeServiceName, totalPrice){
		this.description = description;
		this.serviceCode = serviceCode;
		this.completeServiceName = completeServiceName;
		this.totalPrice = totalPrice;
	}
}

////////// Exports //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export {
  getRates,
  getRatesObjRequestModel,
  getDeliveryDateOfRate,
  groupDeliveryRates,
  
  DeliveryRate,
  DeliveryRateGroup,
  RAResponse
};