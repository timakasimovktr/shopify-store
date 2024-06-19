'use strict';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

var $mobileMenuCloseBtn, $menuToggleBtn;


/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

/* --------------- Utils & Tools --------------- */

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  
  /* --------------- Events Setup --------------- */
  
  /* --------------- Initialization--------------- */
  
  setTimeout(() => {
    document.querySelectorAll('iframe').forEach(($frame) => {
      if(!$frame.title){

        if($frame.src.includes('usablenet')){
          $frame.title = 'UsableNet';
        } else if($frame.src.includes('doubleclick')) {
          $frame.title = 'DoubleClick.Net';
        } else {
          $frame.title = 'Advertisement';
        }
      }
    });
  }, 2000);
  
  /* --------------- Window Export --------------- */
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////