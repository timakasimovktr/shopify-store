'use strict';

import { getCart, updateCartItemsQuantity, UpdateItemsQtyParam } from './../lib/cart';
import { stringToHtml, stringToPrice } from './../utils/parsers';

let quantityChangeTimeout;
let cartDrawer, cartItems, cartEmptyMsg, cartDrawerContent, cartSubtotal, cartIconBubble,
minusIcon, plusIcon, removeIcon, drawerCloseBtn, continueShoppingBtn;

async function refreshMinicart(){
  // Minicart
  let cart = await getCart();
  cartItems.innerHTML = '';

  if(cart.items.length == 0){
    cartEmptyMsg.classList.remove('hidden');
    cartDrawerContent.classList.add('hidden');
    cartIconBubble.classList.add('hidden');
  } else{
    cartEmptyMsg.classList.add('hidden');
    cartDrawerContent.classList.remove('hidden');
    cartIconBubble.classList.remove('hidden');
  }
  
  cart.items.forEach(cartItem => renderCartItem(cartItem, cart));

  cartSubtotal.innerText = stringToPrice(cart.finalTotalPrice/100);
  cartIconBubble.innerText = cart.itemsCount > 99 ? '99+' : cart.itemsCount;
  cartIconBubble.classList.toggle('cart-count-bubble--over-99', cart.itemsCount > 99);
  refreshEvents();
}

function refreshEvents(){
  cartItems.querySelectorAll('.cart-item').forEach((cartItem) => {
    cartItem.querySelector('.quantity__input')?.addEventListener('change', quantityChanged);
    cartItem.querySelector('.cart-item__remove-btn').addEventListener('click', removeCartItem);
  });
}

async function removeCartItem(e){
  e.preventDefault();

  clearTimeout(quantityChangeTimeout);

  let cartItem = e.currentTarget.closest('.cart-item'),
  updateItemQtyParams = [new UpdateItemsQtyParam(cartItem.dataset.key, 0)];
  
  await updateCartItemsQuantity(updateItemQtyParams);

  cartItem.remove();

  await refreshMinicart();
}

function renderCartItem(cartItem, cart){
  let hideClass = '', hasWarrantiesAssignedClass = hasWarrantiesAssigned(cartItem) ? 'has-warranties-assigned' : '';

  if(isCartItemAWarranty(cartItem)){
    hideClass = 'hidden';
  }

  // Modify imageUrl in the cartItem object
  if(cartItem.imageUrl){
    let urlParts = cartItem.imageUrl.split(".jpg");
    cartItem.imageUrl = urlParts[0] + "_150x.jpg" + (urlParts[1] || "");
  }

  cartItems.appendChild(stringToHtml(`
    <div class="cart-item ${hideClass} ${hasWarrantiesAssignedClass}" data-key="${cartItem.key}">
      <a href="${cartItem.url}">
        <img class="cart-item__image" src="${cartItem.imageUrl}" alt="${cartItem.title}" width="150" height="136">
      </a>

      <div class="cart-item__info">
        <a href="${cartItem.url}" class="cart-item__name h4 break">${cartItem.title}</a>
        ${renderCartItemPrices(cartItem)}

        ${renderCartItemDiscounts(cartItem)}
        
        ${renderCartItemQty(cartItem, cart)}

      </div>
    </div>
  `));
}

function renderCartItemQty(cartItem, cart){
  let minusIconCopy = minusIcon.cloneNode(true),
  plusIconCopy = plusIcon.cloneNode(true),
  removeIconCopy = removeIcon.cloneNode(true);

  minusIconCopy.classList.remove('hidden');
  plusIconCopy.classList.remove('hidden');
  removeIconCopy.classList.remove('hidden');

  const cartItemPropertiesWarranty = cartItem.properties?.warrantyId;
  const warrantyUniqueId = cartItem.properties?.warrantyUniqueId;

  let cartItemWarrantyName;

  cart.items.forEach(item => {
    if(item.variantId == cartItemPropertiesWarranty){
      cartItemWarrantyName = item.title;
    } else if (warrantyUniqueId == item.properties?.warrantyRelatedUniqueId){
      cartItemWarrantyName = item.title;
    }
  });

  if(hasWarrantiesAssigned(cartItem)){
    return `
    <div class="cart-item__quantity-wrapper" data-qty="${cartItem.quantity}">
      <span>Qty: ${cartItem.quantity}</span>
      <button class="cart-item__remove-btn button button--tertiary">${removeIconCopy.outerHTML}</button>
    </div>
    <div class="cart-item__quantity-wrapper">
      <span>Warranty: ${cartItemWarrantyName}</span>
    </div>
    `;
  } else {
    return `
    <div class="cart-item__quantity-wrapper" data-qty="${cartItem.quantity}">
      <quantity-input class="quantity">
        <button class="quantity__button no-js-hidden" name="minus" type="button">
          <span class="visually-hidden">Decrease quantity for Silverton Sofa</span>
          ${minusIconCopy.outerHTML}
        </button>
        <input class="quantity__input" type="number" value="${cartItem.quantity}" min="0">
        <button class="quantity__button" name="plus" type="button">
          <span class="visually-hidden">Increase quantity for Silverton Sofa</span>
          ${plusIconCopy.outerHTML}
        </button>
      </quantity-input>
      <button class="cart-item__remove-btn button button--tertiary">${removeIconCopy.outerHTML}</button>
    </div>
    `;
  }
}

function renderCartItemDiscounts(cartItem){
  if(cartItem.finalSubtotal != cartItem.originalSubtotal){
    return `
      <ul class="discounts list-unstyled" >
        <li class="discounts__discount">
          <span class="save_text_discount">Save (-${stringToPrice((cartItem.originalSubtotal - cartItem.finalSubtotal)/100)})</span>
        </li>
      </ul>
    `;
  } else {
    return '';
  }
}

function renderCartItemPrices(cartItem){
  let discount = cartItem.originalSubtotal - cartItem.finalSubtotal;
  if(discount > 0){
    return `
      <div class="cart-item__discounted-prices">
        <s class="cart-item__old-price product-option">${stringToPrice(cartItem.originalSubtotal/100)}</s>
        <strong class="cart-item__final-price product-option">${stringToPrice(cartItem.finalSubtotal/100)}</strong>
      </div>
    `;
  } else {
    return `
    <div class="cart-item__discounted-prices">
      <strong class="cart-item__final-price product-option">${stringToPrice(cartItem.finalSubtotal/100)}</strong>
    </div>
  `;
  }
}

function isCartItemAWarranty(cartItem){
  return cartItem.properties?.appliedToProductUniqueId || cartItem.properties?.warrantyUniqueId;
}

function hasWarrantiesAssigned(cartItem){
  return cartItem.properties?.productUniqueId;
}

async function onDocumentLoaded(){
  cartDrawer = document.querySelector('#CartDrawer');
  cartEmptyMsg = cartDrawer.querySelector('#cart-empty-msg');
  cartItems = cartDrawer.querySelector('.cart-items');
  cartDrawerContent = cartDrawer.querySelector('.cart-drawer-content');
  minusIcon = cartDrawer.querySelector('.hidden-icons .kf-icon__minus');
  plusIcon = cartDrawer.querySelector('.hidden-icons .kf-icon__plus');
  removeIcon = cartDrawer.querySelector('.hidden-icons .kf-icon__close');
  cartSubtotal = cartDrawer.querySelector('.totals__subtotal-value');
  cartIconBubble = document.querySelector('#cart-icon-bubble .cart-count-bubble');
  drawerCloseBtn = cartDrawer.querySelector('.drawer__close');
  continueShoppingBtn = cartDrawer.querySelector('.continue_shopping_button');
  
  document.querySelector('#cart-icon-bubble').addEventListener('click', (e) => {
    if(location.href.endsWith('/cart')){
      e.preventDefault();
      location.reload();
    }
  });

  drawerCloseBtn.addEventListener('click', (e) => {
    e.currentTarget.closest('cart-drawer').close();
  });

  continueShoppingBtn.addEventListener('click', () => {
    drawerCloseBtn.click();
  });

  if(location.href.endsWith('/cart')){
    cartDrawer.classList.add('hidden');
    document.querySelector('#CartDrawer-Overlay').classList.add('hidden');
    document.querySelector('cart-drawer').classList.add('hidden');
  }
  
  refreshMinicart();
}

function quantityChanged(e){
  e.preventDefault();

  clearTimeout(quantityChangeTimeout);

  let cartItem = e.currentTarget.closest('.cart-item');
  cartItem.querySelector('.cart-item__quantity-wrapper').dataset.qty = e.currentTarget.value;

  quantityChangeTimeout = setTimeout(async () => {
    let updateItemQtyParams = [];
    
    updateItemQtyParams = [new UpdateItemsQtyParam(cartItem.dataset.key, cartItem.querySelector('.cart-item__quantity-wrapper').dataset.qty)];
    await updateCartItemsQuantity(updateItemQtyParams);
    await refreshMinicart();
  }, 1000);
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

export { refreshMinicart };