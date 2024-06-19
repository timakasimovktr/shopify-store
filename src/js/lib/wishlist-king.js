'use strict';

;(function () {
  ////////////////////////////////////////////////////////////////////////////////////
  ////////// Classes
  ////////////////////////////////////////////////////////////////////////////////////
  
  ////////////////////////////////////////////////////////////////////////////////////
  ////////// Constants & Variables
  ////////////////////////////////////////////////////////////////////////////////////
  
  /* --------------- Control & Logic --------------- */
  
  let CURRENT_TEMPLATE, wishlistKingInterval;
  
  
  /* --------------- DOM --------------- */
  
  ////////////////////////////////////////////////////////////////////////////////////
  ////////// Functions & Methods
  ////////////////////////////////////////////////////////////////////////////////////
  
  /* --------------- Logic & Process --------------- */
  
  function initWishlistPage(){
    window.WishlistKing.observe({
      selector: "main .rte", // Adjust the selector to target a element
      template: "page", // Only run on pages
      handle: window.WishlistKing.toolkit.settings.wishlistPageHandle, // Use wishlist page handle from app settings
    }, (target) => {
      target.insertAfter(window.WishlistKing.createComponent("wishlist-page"));
    });
  }
  
  function initHeaderComponent(){
    window.WishlistKing.observe({
      selector: '#header-wishlist-king-icon-container' // Adjust the selector target your cart link
    }, (target) => {
      target.append(window.WishlistKing.createComponent('wishlist-link'));
    });
  }
  
  function initPDPComponent(){
    window.WishlistKing.observe({
      selector: "#pdp-atw-wishlist-king", // Adjust the selector to target a element
      template: "product" // Only run on product pages
    }, (target) => {
      target.append(window.WishlistKing.createComponent("wishlist-button", { id: window.product.id }) );
    });
  }
  
  function initCartComponents(){
    window.WishlistKing.observe({
      selector: ".atw-wishlist-king-container"
    }, (target) => {
      target.prepend(window.WishlistKing.createComponent("wishlist-button-floating", { id: target.container.getAttribute("data-wk-product-id") })
      );
    });
  }
  
  function initWishlistComponents(){
    window.WishlistKing.observe({
      selector: ".card__add-to-wishlist-btn"
    }, (target) => {
      target.append(window.WishlistKing.createComponent("wishlist-button-floating", { id: target.container.getAttribute("data-wk-product-id") })
      );
    });
  }
  
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
  
  function wishlistKingOnReady(){
    if(CURRENT_TEMPLATE && CURRENT_TEMPLATE != 'checkout'){
      initHeaderComponent();
    }
    
    if(window.location.href.toLowerCase().includes('/products/')){
      initPDPComponent();
    } else if(CURRENT_TEMPLATE == 'cart'){
      initCartComponents();
    } else if(CURRENT_TEMPLATE == 'page.wishlist-king'){
      initWishlistPage();
    } else if(CURRENT_TEMPLATE == 'collection'){  
      initWishlistComponents();
    } else if(CURRENT_TEMPLATE == 'search'){
      initWishlistComponents();
    }
  }
  
  if(document.readyState != 'loading'){
    onDocumentLoaded();
  } else {
    document.addEventListener('DOMContentLoaded', onDocumentLoaded);
  }
})();