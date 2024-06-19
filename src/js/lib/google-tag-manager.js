'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

function pushDataLayer(obj){
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(obj);
}

function getAddedToCartDataLayer(items){
  return {
    event: 'add_to_cart',
    ecommerce: {
      add: {
        products: items.map(item => {
          return {
            variantId: item.id,
            qty: item.quantity,
            properties: item.properties
          }
        })
      }
    }
  };
}

function getRemovedCartItemDataLayer(productId, price, availability){
  return {
    event: 'remove_from_cart',
    ecommerce: {
      content_id: productId,
      content_type: 'product',
      quantity: 0,
      price: price,
      availability: availability
    }
  };
}

function getCheckoutDataLayer(step, products){
  let newDataLayer = {
    event: 'checkout',
    ecommerce: {
      checkout: {
        actionField: {
          step: step,
          action: 'checkout'
        },
        products: products,
        eventCallback: () => {;}
      }
    }
  };
  
  return newDataLayer;
}

function getDeliveryAPIRequestDataLayer(products, zipCode){
  return {
    event: 'delivery_api',
    ecommerce: {
      products: products,
      zipCode: zipCode
    }
  }
}

function getLocationDataLayer(locationName){
  return {
    event: 'location_click',
    location_id: locationName
  };
}

/* --------------- Utils & Tools --------------- */

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

////////// Exports //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export {
  pushDataLayer,

  getAddedToCartDataLayer,
  getRemovedCartItemDataLayer,
  getCheckoutDataLayer,
  getDeliveryAPIRequestDataLayer,
  getLocationDataLayer
};