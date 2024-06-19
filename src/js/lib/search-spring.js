'use strict';

import SSProduct from "../types/ss-product";
import SSFilter from "./../types/ss-filter";

import { stringToHtml } from './../utils/parsers';
import { initAccordion } from './../components/accordion';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

var SS_API = {
  SITE_ID: 'tk47yo',
  AJAX_CATALOG: 'v3',
  DOMAIN: 'https://api.searchspring.net/api/search/search.json',
  RESULTS_FORMAT: 'native',
  RESULTS_PER_PAGE: 24
};

/* --------------- Control & Logic --------------- */

var mainSectionPrevScrollPosition;

/* --------------- DOM --------------- */

var $ssActions, $filtersOffcanvas, $sortOffcanvas, $stickyHeaderSSActions, $mainSectionSSActions,
$stickyHeader, $mainSection, firstStickyHeaderCheck;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

function setupSSActions(){
  if($ssActions){
    if($ssActions.classList.contains('sticky')){
      $stickyHeaderSSActions = $mainSectionSSActions.cloneNode(true);
      $mainSectionSSActions.classList.remove('hidden');
      $stickyHeader.appendChild($stickyHeaderSSActions);
    }
    
    document.querySelectorAll('.ss-actions .ss-actions__filters').forEach(($btn) => {
      $btn.addEventListener('click', ssActionFiltersOnClick);
    });
  
    document.querySelectorAll('.ss-actions .ss-actions__sort').forEach(($btn) => {
      $btn.addEventListener('click', ssActionSortOnClick);
    });
  
    if($filtersOffcanvas){
      $filtersOffcanvas.querySelector('.offcanvas__header .kf-icon__close').addEventListener('click', () => {
        $filtersOffcanvas.classList.remove('shown');
      });
    
      $filtersOffcanvas.querySelector('.offcanvas__clear-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.closest('filters-offcanvas').querySelectorAll('li input:checked').forEach((radio) => { radio.checked = false; });
        $filtersOffcanvas.querySelector('.offcanvas__apply-btn').click();  
      });
    }
  
    if($sortOffcanvas){
      $sortOffcanvas.querySelectorAll('ul li').forEach(($sortOptionLi) => {
        $sortOptionLi.querySelector('input').addEventListener('change', sortOptionOnChange);
      });
    
      $sortOffcanvas.querySelectorAll('ul li label').forEach(($sortOptionLabel) => {
        $sortOptionLabel.addEventListener('click', sortOptionLabelOnClick);
      });
    
      $sortOffcanvas.querySelector('.offcanvas__header .kf-icon__close').addEventListener('click', () => {
        $sortOffcanvas.classList.remove('shown');
      });
    }
    
    window.addEventListener('scroll', checkSSActionsSickyBehaviour);
  }

  checkSSActionsSickyBehaviour();
}

async function getSSProducts(ssFilters, ssSorting, page, collectionId = ''){
  var ssProducts = [], apiUrl = getSSProductsApiUrl(page, collectionId);
  
  // Filters
  if(ssFilters.length > 0){
    apiUrl += '&' + ssFilters.map(ssFilter => ssFilter.getUrlFilter()).join('&');
  }
  // Sort
  if(ssSorting){
    apiUrl += '&' + ssSorting;
  }

  const res = await fetch(encodeURI(apiUrl))
  .then(res => res.json())
  .then((res) => { return res; });
  
  ssProducts = res.results.map((result) => {
    var id = parseInt(result.uid),
    sku = result.sku,
    handle = result.handle,
    title = result.name,
    price = parseFloat(result.price),
    compareAtPrice = parseFloat(result.variant_compare_at_price),
    url = result.url,
    featuredImageUrl = result.image,
    secondaryImageUrl = result.ss_image_hover,
    colorRelatedHandles = result.mfield_product_colorrelatedhandles ? result.mfield_product_colorrelatedhandles.split(',') : [],
    collectionSubheader = result.mfield_product_collectionsubheader,
    closeout = result.ss_is_closeout,
    isNew = result.ss_is_new,
    variantId = result.variant_id,
    tags = result.tags,
    iscSoon = result.ss_is_csoon;

    return new SSProduct(id, sku, handle, title, price, compareAtPrice, url, featuredImageUrl, secondaryImageUrl, colorRelatedHandles, collectionSubheader, closeout, isNew, variantId, tags, iscSoon);
  });

  return ssProducts;
}

async function getSuggestions(query){
  const endpoint = `https://${SS_API.SITE_ID}.a.searchspring.io/api/suggest/query?siteId=${SS_API.SITE_ID}&q=${query}&integratedSpellCorrection=true&language=en&suggestionCount=4&productCount=20`,
  ssSuggesitons = await (await fetch(endpoint)).json();

  return ssSuggesitons;
}

async function getAvailableSSFilters(query = null){
  let collectionId = window.LC?.searchSpring?.collectionId, apiUrl;

  apiUrl = getSSProductsApiUrl(false, collectionId ? collectionId : null);

  if(query){
    apiUrl += '&q=' + encodeURI(query);
  }

  const res = await fetch(apiUrl)
  .then(res => res.json())
  .then((res) => { return res; });

  return res.facets;
}

/**
 * Takes the filters from the SS Filters panel
 * 
 * @param {*} textSearch 
 * @returns 
 */
function getCurrentSSFilters(textSearch){
  var ssFilters = [];
  
  $filtersOffcanvas.querySelectorAll('.accordion li input:checked').forEach($selectedInput => {
    var filterName = $selectedInput.closest('.accordion').dataset.ssFilterName,
    rangeMin, rangeMax;

      if($selectedInput.dataset.ssFilterType != 'range'){
        ssFilters.push(new SSFilter(filterName, 'value', $selectedInput.value, null, null));
      } else {
        rangeMin = $selectedInput.value.split('-')[0];
        rangeMax = $selectedInput.value.split('-')[1];
        ssFilters.push(new SSFilter(filterName, 'range', null, rangeMin, rangeMax));
      }
  });

  if(textSearch){
    ssFilters.push(new SSFilter('rq', 'refine-query', textSearch, null, null));
  }

  return ssFilters;
}

function getCurrentSSSorting(){
  var $selectedSortInput = $sortOffcanvas.querySelector('input:checked'),
  $sortDirection;

  if($selectedSortInput){
    $sortDirection = $selectedSortInput.closest('li').querySelector('.ss-sort__direction:not(.hidden)');
    return `sort.${$selectedSortInput.dataset.ssFieldName}=${$sortDirection.classList.contains('ss-sort__asc') ? 'asc' : 'desc'}`;
  } else {
    return false;
  }
}

function setupSearchCallback(callback){
  $filtersOffcanvas.querySelectorAll('.offcanvas__apply-btn').forEach(($filterApplyBtn) => {
    $filterApplyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      $filtersOffcanvas.classList.remove('shown');
      callback();
    });
  });

  $sortOffcanvas.querySelectorAll('.offcanvas__apply-btn').forEach(($sortApplyBtn) => {
    $sortApplyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      $sortOffcanvas.classList.remove('shown');
      callback();
    });
  });
}

async function initFilters(){
  var ssFacets = await getAvailableSSFilters(),
  $iconMinus = document.querySelector('.hidden-icons .kf-icon__minus'),
  $iconPlus = document.querySelector('.hidden-icons .kf-icon__plus'),
  $filtersOffcanvas = document.querySelector('#filters-offcanvas'),
  $filtersOffcanvasContent = $filtersOffcanvas.querySelector('.offcanvas__content');

  ssFacets.forEach((facet, i) => {
    var $iconMinusCopy = $iconMinus.cloneNode(true),
    $iconPlusCopy = $iconPlus.cloneNode(true),
    shouldOrder = false;
    
    $iconMinusCopy.style.opacity = 0;
    $iconPlusCopy.style.opacity = 1;

    $iconMinusCopy.classList.remove('hidden');
    $iconPlusCopy.classList.remove('hidden');

    if(facet.field == 'mfield_product_webcover' || facet.field == 'mfield_product_webcovercontent'){
      shouldOrder = true;
    }

    var $accordion = stringToHtml(`
      <div class="accordion" data-ss-filter-name="${facet.field}">
        <label class="accordion__header" for="${facet.field}-accordion__input-${i}">
          <h3 class="accordion__header-title h4">${facet.label}</h3>
          ${$iconMinusCopy.outerHTML}
          ${$iconPlusCopy.outerHTML}
        </label>

        <input type="checkbox" id="${facet.field}-accordion__input-${i}" class="accordion__input hidden">
        <div class="accordion__content">
          ${getSSFilterOptions(facet, shouldOrder)}
        </div>
      </div>
    `);
    
    
    $filtersOffcanvasContent.appendChild($accordion);

    initAccordion($accordion, true);
  });
}

function getSSFilterOptions(facetFilter, order){
  if(order){
    facetFilter.values = facetFilter.values.sort(sortFilterValues);
  }
  
  var options = facetFilter.values.map((v, i) => `
    <li>
      <input id="${facetFilter.field + '-' + i}" type="radio" name="${facetFilter.label.toLowerCase()}" value="${v.type != 'range' ? v.value : v.low + '-' + v.high}" data-ss-filter-type="${v.type}">
      <label class="d-block" for="${facetFilter.field + '-' + i}">${v.label} <span class="ss-filter_results">(${v.count})</span></label>
    </li>
  `).join('');

  return `<ul>${options}</ul>`;
}

/* --------------- Utils & Tools --------------- */

function sortFilterValues(a, b) {
  if (a.value < b.value) {
    return -1;
  } else if (a.value > b.value) {
    return 1;
  } else {
    return 0;
  }
}

function getSSProductsApiUrl(page = 1, collectionId){
  var url = `${SS_API.DOMAIN}?siteId=${SS_API.SITE_ID}&ajaxCatalog=${SS_API.AJAX_CATALOG}&domain=${(new URL(location.href)).hostname}&resultsFormat=${SS_API.RESULTS_FORMAT}&resultsPerPage=${SS_API.RESULTS_PER_PAGE}`;

  if(collectionId){
    url += `&bgfilter.collection_id=${collectionId}`;
  }

  if(page){
    url += `&page=${page}`;
  }

  return url;
}

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  firstStickyHeaderCheck = true;
  $ssActions = document.querySelector('.ss-actions');
  $filtersOffcanvas = document.querySelector('#filters-offcanvas');
  $sortOffcanvas = document.querySelector('#sort-offcanvas');
  $mainSectionSSActions = document.querySelector('main .ss-actions');
  $stickyHeader = document.querySelector('sticky-header');
  if($sortOffcanvas){
    $mainSection = $sortOffcanvas.parentElement;
  }

  /* --------------- Events Setup --------------- */
  
  /* --------------- Initialization--------------- */
  
  window.LC = window.LC || {};
  window.LC.searchSpring = window.LC.searchSpring ||{};
  window.LC.searchSpring.perPage = SS_API.RESULTS_PER_PAGE;
}

function sortOptionOnChange(e){
  var $sortOptionLi = e.currentTarget.closest('li'),
  $input = e.currentTarget;
  
  if($input.checked){
    $sortOptionLi.querySelector('.ss-sort__asc').classList.remove('hidden');
    $sortOptionLi.querySelector('.ss-sort__desc').classList.add('hidden');
  } else {
    $sortOptionLi.querySelector('.ss-sort__asc').classList.add('hidden');
    $sortOptionLi.querySelector('.ss-sort__desc').classList.add('hidden');
  }
}

function sortOptionLabelOnClick(e){
  var $sortOptionLi = e.currentTarget.closest('li'),
  $input = $sortOptionLi.querySelector('input');

  if($input.checked){
    $sortOptionLi.querySelector('.ss-sort__asc').classList.toggle('hidden');
    $sortOptionLi.querySelector('.ss-sort__desc').classList.toggle('hidden');
  }
}

function checkSSActionsSickyBehaviour(){
  if(!$ssActions || !$ssActions.classList.contains('sticky')){
    return;
  }
  
  let scrollTriggered = false, currentTargetBoundingRectTop = $mainSection.getBoundingClientRect().top;

  if(currentTargetBoundingRectTop >= 0 && mainSectionPrevScrollPosition < 0){
    scrollTriggered = true;
  } else if(currentTargetBoundingRectTop < 0 && mainSectionPrevScrollPosition >= 0){
    scrollTriggered = true;
  }

  if(scrollTriggered || firstStickyHeaderCheck){
    firstStickyHeaderCheck = false;
    if(currentTargetBoundingRectTop < 0){
      $stickyHeaderSSActions.classList.remove('hidden');
      $mainSectionSSActions.style.visibility = 'hidden';
    } else {
      $stickyHeaderSSActions.classList.add('hidden');
      $mainSectionSSActions.style.visibility = '';
    }
  }
  
  mainSectionPrevScrollPosition = currentTargetBoundingRectTop;
}

function ssActionFiltersOnClick(){
  $filtersOffcanvas.classList.toggle('shown');
  $sortOffcanvas.classList.remove('shown');
}

function ssActionSortOnClick(){
  $sortOffcanvas.classList.toggle('shown');
  $filtersOffcanvas.classList.remove('shown');
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////// Exports //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export {
  setupSSActions,
  getSSProducts,
  getSuggestions,
  getAvailableSSFilters,
  initFilters,

  getCurrentSSFilters,
  getCurrentSSSorting,
  setupSearchCallback,

  SSFilter
};