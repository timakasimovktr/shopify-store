'use strict';

import WishlistKing from './lib/wishlist-king';

////////////////////////////////////////////////////////////////////////////////////
////////// Classes
////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
////////// Constants & Variables
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

/* --------------- DOM --------------- */

////////////////////////////////////////////////////////////////////////////////////
////////// Functions & Methods
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

/* --------------- Utils & Tools --------------- */

////////////////////////////////////////////////////////////////////////////////////
////////// Events
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  CURRENT_TEMPLATE = document.querySelector('body').dataset.template;

  /* --------------- Events Setup --------------- */
  
  /* --------------- Initialization--------------- */

  if(!window.WishlistKing){
    wishlistKingInterval = setInterval(() => {
      if(window.WishlistKing){
        clearInterval(wishlistKingInterval);
        wishlistKingOnReady();
      }
    }, 500);
  }
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}