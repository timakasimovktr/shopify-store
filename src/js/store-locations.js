'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
import Glide from '@glidejs/glide';
import { stringToHtml } from './utils/parsers';
import { RESPONSIVE_BREAKPOINTS } from './variables';
import * as gtm from './lib/google-tag-manager';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

// Used in getGlideOptions
var GLIDE_OPTIONS = {
  type: 'carousel',
  gap: 30
};

const API_URL = 'https://maps.googleapis.com/maps/api/staticmap?center=',
API_OPTIONS = '&zoom=17&size=500x500&markers=color:002f86%7C',
API_KEY = '&key=AIzaSyAHTwUlFGC5vrVUmBeDggBshQN2yoiRSF0&libraries=geometry';

/* --------------- Control & Logic --------------- */

var STORE_LOCATIONS = [], glideSlider, windowResizeTimeout;

/* --------------- DOM --------------- */

var $storeLocationsContainer;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

function renderStoreLocations(){
  if(!STORE_LOCATIONS){
    return;
  }
  
  STORE_LOCATIONS.map(storeLoc => {
    const $storeLoc = createStoreLocationCardElem(storeLoc);
    $storeLoc.addEventListener('click', () => {
      gtm.pushDataLayer(
        gtm.getLocationDataLayer($storeLoc.querySelector('.store-location-card__title').innerText.trim())
      );

      // For GTM to send the info
      setTimeout(() => {
        window.location.href = storeLoc.storePage;
      }, 500);
    });
    $storeLocationsContainer.append($storeLoc)
  });

  if(!glideSlider){
    glideSlider = new Glide(document.querySelector('#store-locations__cards-container').closest('.glide'), getGlideOptions()).mount();
  } else {
    glideSlider.update(getGlideOptions());
  }
}

function createStoreLocationCardElem(storeLocationData){
  let imageSrc = `${API_URL}${storeLocationData.latitude},${storeLocationData.longitude}${API_OPTIONS}${storeLocationData.latitude},${storeLocationData.longitude}${API_KEY}`,
  hasCustomImage = storeLocationData.customImage?.url ? true : false,
  googleMapsBgStyle, lazyloadBgAttr, focalPoint = 'center';
  
  if(hasCustomImage){
    imageSrc = storeLocationData.customImage.url;
    lazyloadBgAttr = `data-bg="${imageSrc}"`;
    focalPoint = storeLocationData.customImage.focalPoint;
  } else {
    googleMapsBgStyle = `background-image: url(${imageSrc});`;
  }

  return stringToHtml(`
  <li class="store-location-card">
    <div
      class="store-location-card__img-container ${hasCustomImage ? 'lazyload' : ''}"
      ${hasCustomImage ? lazyloadBgAttr : ''}
      style="${!hasCustomImage ? googleMapsBgStyle : ''} object-position: ${focalPoint}"
    ></div>
    <div class="store-location-card__body">
      <h3 class="store-location-card__title">${storeLocationData.name}</h3>
      <address>${storeLocationData.address}</address>
      <span class="store-location-card__phone">${storeLocationData.phone}</span>
      <span class="store-location-card__hours">${storeLocationData.hours}</span>
      <span class="store-location-card__directions">directions ></span>
    </div>
  </li>
  `);
}

/* --------------- Utils & Tools --------------- */

function getGlideOptions(){
  var perView;

  if(window.innerWidth < RESPONSIVE_BREAKPOINTS.MEDIUM){
    perView = 1;
  } else if(window.innerWidth < RESPONSIVE_BREAKPOINTS.LARGE){
    perView = 2;
  } else if(window.innerWidth < RESPONSIVE_BREAKPOINTS.XL){
    perView = 3;
  } else {
    perView = 4;
  }
  
  return Object.assign(GLIDE_OPTIONS, { perView: perView });
}

////////// Events //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  STORE_LOCATIONS = window.LC?.storeLocations;

  $storeLocationsContainer = document.querySelector('#store-locations__cards-container.glide__slides');
  if(!$storeLocationsContainer){
    return;
  }
  
  /* --------------- Events Setup --------------- */

  window.addEventListener('resize', () => {
    clearTimeout(windowResizeTimeout);
    windowResizeTimeout = setTimeout(() => {
      clearTimeout(windowResizeTimeout);
      renderStoreLocations();
    }, 250);
  });

  /* --------------- Initialization--------------- */

  renderStoreLocations();
  
  /* --------------- Window Export --------------- */

  // LazyLoad update
  window.ll?.update();
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////