'use strict';

// Styling //////////////////////////////////
////////////////////////////////////////////
import './../sass/pages/store-location.scss';
import { stringToHtml } from './utils/parsers';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

/* --------------- DOM --------------- */

var $mainStoreContainer, $googleMapContainer, $storeInfoContainer,
$title, $address, $directions, $phone, $hours;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

/* --------------- Utils & Tools --------------- */

function getTargetStore(){
  var linkSplit = location.href.split('/'), lastSplit, storeName;

  lastSplit = linkSplit[linkSplit.length-1];

  if(lastSplit.includes('?')){
    storeName = lastSplit.split('?')[0];
  } else {
    storeName = lastSplit;
  }

  storeName = storeName.toLowerCase();

  if(storeName.includes('location-')){
    storeName = storeName.replace('location-', '');
  }
  
  return window.LC?.storeLocations?.find(sl => sl.name.toLowerCase().replaceAll(' ', '-') == storeName);
}

/* --------------- Renders --------------- */

function populateStoreInformation(){
  var targetStore = getTargetStore();

  $title.innerText = targetStore.name;
  $address.innerHTML = targetStore.address;
  $directions.href = targetStore.redirectToStorePage && targetStore.storePage ? targetStore.storePage : targetStore.googleMapUrl;
  $phone.innerText = targetStore.phone;
  $hours.innerHTML = targetStore.hours;

  $mainStoreContainer.style.opacity = 1;
}

////////// Events //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  $mainStoreContainer = document.querySelector('#store');
  $storeInfoContainer = $mainStoreContainer.querySelector('#store-information');
  $googleMapContainer = $mainStoreContainer.querySelector('#google-map-container');
  $title = $mainStoreContainer.querySelector('.store__title');
  $address = $mainStoreContainer.querySelector('.store__address');
  $directions = $mainStoreContainer.querySelector('.store__directions');
  $phone = $mainStoreContainer.querySelector('.store__phone');
  $hours = $mainStoreContainer.querySelector('.store__hours');
  
  /* --------------- Events Setup --------------- */
  
  /* --------------- Initialization--------------- */
  
  populateStoreInformation();
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////