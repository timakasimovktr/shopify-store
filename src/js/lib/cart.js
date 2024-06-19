'use strict';

////////// Dependencies ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

import * as gtm from './google-tag-manager';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

async function getCart(){
  var res = await (await fetch('/cart.js')).json(),
  cart = new Cart(
    res.items.map(ci => getCartItemsFromCartFetch(ci)),
    res.total_price,
    res.item_count
  );

  return cart;
}

/**
 * 
 * @param {AddToCartParam[]} items
 * @returns 
 */
async function addToCart(items){
  gtm.pushDataLayer(gtm.getAddedToCartDataLayer(items));

  items = addFreeShippingProperties(items);
  
  return await (await fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: items
    })
  })).json();
}

function addFreeShippingProperties(cartItems){
  for (let i = 0; i < cartItems.length; i++) {
    if(window.product?.tags?.map(tag => tag.toLowerCase()).includes('freeshipping')){
      cartItems[i].properties['freeShipping'] = true;
    }
  }
  return cartItems;
}

/**
 * 
 * @param {UpdateItemsQtyParam[]} updates
 * @returns 
 */
 async function updateCartItemsQuantity(updates){
  var formattedUpdates = {};
  updates.forEach((update) => { formattedUpdates[update.key] = +update.newQuantity; });

  return await (await fetch('/cart/update.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      updates: formattedUpdates
    })
  })).json();
}

/**
 * 
 * @param {UpdateItemPropertiesParam} update
 * @returns 
 */
 async function updateCartItemProperties(update){
  var formattedUpdate = {
    id: update.key,
    quantity: update.quantity,
    properties: update.properties
  };

  return await (await fetch('/cart/change.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formattedUpdate)
  })).json();
}

/* --------------- Utils & Tools --------------- */

function getCartItemsFromCartFetch(fetchedCartItem){
  return new CartItem(
    fetchedCartItem.key,
    fetchedCartItem.product_id,
    fetchedCartItem.sku,
    fetchedCartItem.product_title,
    fetchedCartItem.quantity,
    fetchedCartItem.id,
    fetchedCartItem.original_price,
    fetchedCartItem.final_price,
    fetchedCartItem.image,
    fetchedCartItem.url,
    fetchedCartItem.properties
  );
}

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

class AddToCartParam {
  id;
  quantity;
  properties;

  constructor(id, quantity, properties){
    this.id = id;
    this.quantity = quantity;
    this.properties = properties;
  }
}

class UpdateItemsQtyParam {
  key;
  newQuantity;

  constructor(key, newQuantity){
    this.key = key;
    this.newQuantity = newQuantity;
  }
}

class UpdateItemPropertiesParam {
  key;
  quantity;
  properties;

  constructor(key, quantity, properties){
    this.key = key;
    this.quantity = quantity;
    this.properties = properties;
  }
}

class CartItem {
  key;
  id;
  sku;
  title;
  quantity;
  variantId;
  originalPrice;
  finalPrice;
  originalSubtotal;
  finalSubtotal;
  imageUrl;
  url;
  properties;
  freeShipping;
  packagedProducts;
  shippingRates;

  constructor(key, id, sku, title, quantity, variantId, originalPrice, finalPrice, imageUrl, url, properties, freeShipping = false, packagedProducts = [], shippingRates = []){
    this.key = key;
    this.id = id;
    this.sku = sku;
    this.title = title;
    this.quantity = quantity;
    this.variantId = variantId;
    this.originalPrice = originalPrice;
    this.finalPrice = finalPrice;
    this.imageUrl = imageUrl;
    this.url = url;
    this.properties = properties;
    this.freeShipping = freeShipping;
    this.packagedProducts = packagedProducts;
    this.shippingRates = shippingRates;

    this.originalSubtotal = this.quantity * this.originalPrice;
    this.finalSubtotal = this.quantity * this.finalPrice;
  }
}

class Cart {
  items;
  finalTotalPrice;
  itemsCount;

  constructor(items, finalTotalPrice, itemsCount){
    this.items = items;
    this.finalTotalPrice = finalTotalPrice;
    this.itemsCount = itemsCount;
  }
}

////////// Exports //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export {
  getCart,
  addToCart,
  updateCartItemsQuantity,
  updateCartItemProperties,

  AddToCartParam,
  UpdateItemsQtyParam,
  UpdateItemPropertiesParam,
  CartItem
};