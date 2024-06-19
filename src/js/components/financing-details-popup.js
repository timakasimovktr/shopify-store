'use strict';
////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

let financingPopupVisibilityTimeout, $financingPopup, $tdProductPrice, $tdMonthlyPrice;

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */


function showFinancingDetailsPopup(show, productPrice = 0){
  clearTimeout(financingPopupVisibilityTimeout);

  if(show){
    $financingPopup.classList.remove('hidden');
    financingPopupVisibilityTimeout = setTimeout(() => {
      $financingPopup.style.opacity = 1;
    }, 0);
  } else {
    $financingPopup.style.opacity = 0;
    financingPopupVisibilityTimeout = setTimeout(() => {
      $financingPopup.classList.add('hidden');
    }, 300);
  }
}

/* --------------- Utils & Tools --------------- */


////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  $financingPopup = document.querySelector('#financing-details-popup');
  $tdProductPrice = $financingPopup.querySelector('.financing_popup__product-price');
  $tdMonthlyPrice = $financingPopup.querySelector('.financing_popup__monthly-price');
  
  /* --------------- Events Setup --------------- */

  $financingPopup.querySelector('.kf-icon__close').addEventListener('click', (e) => {
    e.preventDefault();
    showFinancingDetailsPopup(false);
  });

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

export { showFinancingDetailsPopup };
