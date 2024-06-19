'use strict';

import * as searchSpring from "./lib/search-spring";
import { stringToHtml } from "./utils/parsers";
import getParamFromUrl from "./utils/get-param-from-url";
import getRelatedColorsMarkup from "./components/get-related-colors-markup";
import * as financingDetailsPopup from './components/financing-details-popup';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

var LAZY_PAGINATION_SCROLLING_HEIGHT_BEFORE = window.innerHeight * 1.5, noMoreProductsFound = false,
shouldLoadMoreProducts = true;

/* --------------- Control & Logic --------------- */

var ssApiCurrentPage = 1;

/* --------------- DOM --------------- */

var $ssActions, $resultsContainer, $searchInput, $searchButton, $spinnerLoading;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

async function getResults(append){
  if($searchInput.value == ''){
    return;
  }

  if(!append){
    $resultsContainer.innerHTML = '';
    ssApiCurrentPage = 1;
  }

  $spinnerLoading.classList.remove('hidden');

  
  var textSearch = $searchInput.value,
  ssProducts = await searchSpring.getSSProducts(searchSpring.getCurrentSSFilters(textSearch), searchSpring.getCurrentSSSorting(), ssApiCurrentPage);

  if(ssProducts.length < window.LC?.searchSpring?.perPage){
    noMoreProductsFound = true;
  } else {
    shouldLoadMoreProducts = true;
  }
  
  $spinnerLoading.classList.add('hidden');
  
  ssProducts.forEach(ssProd => {
    let $card = stringToHtml(ssProd), $financOptions = $card.querySelector('.financing-option');

    if($financOptions){
      $financOptions.addEventListener('click', (e) => {
        e.preventDefault();
        let price = $card.querySelector('.price-item').innerText.replace('$', '').replace(',', '');
        financingDetailsPopup.showFinancingDetailsPopup(true, parseFloat(price));
      });
    }

    $resultsContainer.appendChild($card);
  });

  getRelatedColorsMarkup($resultsContainer.querySelectorAll('.grid__item[has-color-related-handles]'));

  // LazyLoad update
  window.ll?.update();
}

/* --------------- Utils & Tools --------------- */

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

async function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  
  $ssActions = document.querySelector('.ss-actions');
  document.querySelector('sticky-header').appendChild($ssActions);
  $ssActions.classList.remove('hidden');
  $searchInput = document.querySelector('.search-input');
  $searchButton = document.querySelector('.search-button');
  $resultsContainer = document.querySelector('#product-grid');
  $spinnerLoading = document.querySelector('#ssCatalog .kf-icon__spinner');
  

  /* --------------- Events Setup --------------- */

  $searchInput.addEventListener('keypress', (e) => {
    if(e.keyCode == 13){ getResults(false); }
  });

  $searchButton.addEventListener('click', () => { getResults(false); });

  window.addEventListener('scroll', async () => {
    if(!noMoreProductsFound && shouldLoadMoreProducts && (($resultsContainer.getBoundingClientRect().top + $resultsContainer.clientHeight - window.innerHeight) - LAZY_PAGINATION_SCROLLING_HEIGHT_BEFORE < 0)){
      shouldLoadMoreProducts = false;
      ssApiCurrentPage++;
      await getResults(true);
    }
  });
  
  searchSpring.setupSearchCallback(onSsActionsApplied);

  /* --------------- Initialization--------------- */

  var queryString = getParamFromUrl('q');

  if(queryString){
    $searchInput.value = queryString;
    getResults(false);
  }

  searchSpring.setupSSActions();
}

/**
 * After applying SS sorting or filters
 */
async function onSsActionsApplied(){
  ssApiCurrentPage = 1;
  getResults(false);
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////