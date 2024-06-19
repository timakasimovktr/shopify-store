'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

/* --------------- DOM --------------- */

let $continueInput, $errorMsg;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

function navigateToLocations(){
  if($continueInput.value.length > 0){
    $errorMsg.classList.add('hidden');
    location.href = '/pages/store-locations?zipcode=' + $continueInput.value;
  } else {
    $errorMsg.classList.remove('hidden');
  }
}

/* --------------- Utils & Tools --------------- */

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  $continueInput = document.querySelector('.input-continue .input-continue__input');
  $errorMsg = document.querySelector('.input-continue .input-continue__error-msg');
  let template = document.querySelector('body').dataset.template;

  if(!['index'].includes(template)){
    return;
  }
  
  /* --------------- Events Setup --------------- */

  if ($continueInput) {
    $continueInput.addEventListener('keypress', function(e){
      if(e.keyCode == 13){
        navigateToLocations();
      }
    });

    document.querySelector('.input-continue .kf-icon__arrow').addEventListener('click', navigateToLocations);
  }
  /* --------------- Initialization--------------- */
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener("DOMContentLoaded", onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////