'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

import { priceToFloat, warrantyPriceToFloat, stringToHtml, stringToPrice } from './utils/parsers';
import * as synchronyLib from './lib/synchrony-checkout';
import { getCart, updateCartItemProperties, UpdateItemPropertiesParam } from './lib/cart';
import objectHash from 'object-hash';
import * as gtm from './lib/google-tag-manager';
import { performLimittedSum, getWarrantyStartingSku } from './lib/warranties';
import moment from 'moment';
import { fetchCartData } from './cart';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

const CHECKOUT_STEPS = {
  CONTACT: 'contact_information',
  SHIPPING: 'shipping_method',
  PAYMENT: 'payment_method',
  REVIEW: 'review'
};
let pageLoaded, synchronyData, mutationTimeout, cart, shippingRatesLoadedInterval, financedTotals;

/* --------------- DOM --------------- */

let synchronyGateway, synchronyGatewayContainer, completeOrderBtn, targetCheckoutForm,
cartConfirmationModal, closeIconCopy, taxesElem, spinnerIcon, financingOfferBtns;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

const onShippingStep = () => {
  const shippingMethodsContainer = document.querySelector('.section.section--shipping-method .section__content');
  shippingMethodsContainer.addEventListener('change', (e) => {
    const radioWrapper = e.target.closest('.radio-wrapper');
    const provider = radioWrapper?.dataset.shippingMethod;
    const zoneId = decodeURIComponent(provider).split('|')[1]?.split('-')[0];
    const dateContainer = radioWrapper.querySelector('.radio__label__primary .small-text');
    const dateRow = dateContainer.textContent?.split('Order now, available for delivery by')[1]?.split(', ')[1];
    const date = moment(dateRow).format('YYYY-MM-DD');
    if (dateRow) {
      localStorage.setItem('checkout-date', date)
      localStorage.setItem('checkout-rate-zone-id', zoneId)
    }
  })
}

const onPayementStep = async () => {
  const shippingDate = localStorage.getItem('checkout-date');
  if (shippingDate) {
    await fetchCartData('/cart/update.js', {note: `DeliveryDate: ${shippingDate}`})
    localStorage.removeItem('checkout-date')
  }
}

document.addEventListener('page:load', () => {
  const currentStep = window.Shopify.Checkout.step
  if (currentStep === 'shipping_method') {
    onShippingStep();
  }
  if (currentStep === 'payment_method') {
    onPayementStep();
  }
})

function pushGTMDataLayers(){
  let currentStep = 0;
  switch(window.Shopify?.Checkout?.step){
    case CHECKOUT_STEPS.CONTACT:
      currentStep = 1;
      break;
    case CHECKOUT_STEPS.SHIPPING:
      currentStep = 2;
      break;
    case CHECKOUT_STEPS.PAYMENT:
      currentStep = 3;
      break;
  }

  for (let i = 0; i < currentStep; i++) {
    gtm.pushDataLayer(gtm.getCheckoutDataLayer(+i+1, window.checkoutProducts));
  }
}

/**
 * Updates cart items with installments = 60
 * and setups localStorage variables
 */
async function prepareApprovedSixtyMonthsOption(){
  var cartItemKeys = '';

  await updateCartItemsSixtyMonthsProperties();

  cart.items.forEach((cartItem) => {
    cartItemKeys += cartItem.key;
  });
  
  saveSynchronyDataParams(true, objectHash({hash: cartItemKeys}));
  injectOrderAttributesFromLocalStorage();
}

function refreshEvents(){
  targetCheckoutForm.querySelectorAll('[name="checkout[payment_gateway]"]').forEach(($gatewayRadio) => {
    $gatewayRadio.removeEventListener('change', gatewaySelectionChanged);
    $gatewayRadio.addEventListener('change', gatewaySelectionChanged);
  });
}

/**
 * Checks if current gateway is 60 months
 * financing option and if it was previously
 * approved checking the hash.
 * If not, cleans values and reloads page
 * if cart items were updated.
 */
async function checkCurrentSixtyMonths(){
  var localStoragesixtyMonthsHash = loadSynchronyDataParams()?.sixtyMonthsHash, cartItemKeys = '',
  atLeastOneHasSixtyMonths = false, allHaveSixtyMonths = true;

  cart.items.forEach((cartItem) => {
    cartItemKeys += cartItem.key;
  });

  // atLeastOneHasSixtyMonths
  for (let i = 0; i < cart.items.length; i++) {
    if(cart.items[i].properties?.installments == 60){
      atLeastOneHasSixtyMonths = true;
      break;
    }
  }

  // allHaveSixtyMonths
  for (let i = 0; i < cart.items.length; i++) {
    if(cart.items[i].properties?.installments != 60){
      allHaveSixtyMonths = false;
      break;
    }
  }

  if(atLeastOneHasSixtyMonths && allHaveSixtyMonths && localStoragesixtyMonthsHash == objectHash({hash: cartItemKeys})){
    return true;
  } else if(localStoragesixtyMonthsHash){
    await cleanSixtyMonthsOptionData(atLeastOneHasSixtyMonths);
    return false;
  }
}

async function updateCartItemsSixtyMonthsProperties(clean = false){
  var i = 0, newInstallmentsValue = clean ? 0 : 60;
  
  // Thanks to Shopify, cart item KEYS are changing OR items don't update sometimes, so I'll get the cart each time -.-
  do {
    cart.items[i].properties = cart.items[i].properties || {};

    if(cart.items[i].properties.installments != newInstallmentsValue){
      cart.items[i].properties.installments = newInstallmentsValue;
      await updateCartItemProperties(new UpdateItemPropertiesParam(cart.items[i].key, cart.items[i].quantity, cart.items[i].properties));
      i = 0;
      cart = await getCart();
    } else {
      i++;
    }
  } while(i < cart.items.length);
}

/**
 * Finds and select the shipping rate that
 * matches with the localStorage one.
 * Format: Shipping Rate Provider-D_07_10_2022|FIC-39.99
 */
function preselectShippingRate() {
  let localStorageShippingRate = localStorage.getItem('LC-shipping-rate');
  let $shippingRates = document.querySelectorAll('.step__sections [data-shipping-method]');

  let deliveryRatesQTY = 0;
  $shippingRates.forEach(($shippingRate) => {
    let shippingRateText = $shippingRate.querySelector(".radio__label__primary").getAttribute('data-shipping-method-label-title');
    if (shippingRateText.toLowerCase().includes('delivery')) {
      deliveryRatesQTY++;
    }
  });

  if (deliveryRatesQTY > 1) {
    const rateElements = document.querySelectorAll('.section--shipping-method .radio-wrapper');

    for (let i = 0; i < rateElements.length; i++) {
      if (rateElements[i].dataset.shippingMethod?.toUpperCase().includes('-SD_')) {
        rateElements[i].closest('.content-box__row').remove();
        break;
      }
    }
  }

  if (!localStorageShippingRate) {
    return;
  }

  let selectedShippingRate = null;
  for (let i = 0; i < $shippingRates.length; i++) {
    const shippingMethod = decodeURI($shippingRates[i].dataset.shippingMethod).toLowerCase();
    if (shippingMethod.includes(localStorageShippingRate.toLowerCase())) {
      selectedShippingRate = $shippingRates[i];
      break;
    }
  }

  if (selectedShippingRate) {
    const firstShippingRate = $shippingRates[0];
    firstShippingRate.querySelector('input').removeAttribute('checked');
    selectedShippingRate.querySelector('input').setAttribute('checked', true);
  }
}

function removeStandarDeliveryIfNeeded() {
  shippingRatesLoadedInterval = setInterval(() => {
    if (document.querySelector('.step__sections [data-shipping-method]')) {
      clearInterval(shippingRatesLoadedInterval);
      preselectShippingRate();
    }
  }, 250);
}

/* --------------- Utils & Tools --------------- */

/**
 * Function needed because of mutations.
 * DOM elements removed/re-added and variables
 * needing to be updated.
 * 
 * Returns true when checkout step other than PAYMENT.
 * Returns true when checkout step is PAYMENT AND synchrony gateway is shown.
 */
function afterMutationCacheSetup(){
  synchronyGateway = document.querySelector(`#checkout_payment_gateway_${window.LC?.synchrony?.gatewayId}`);

  if(window.Shopify?.Checkout?.step == CHECKOUT_STEPS.CONTACT || window.Shopify?.Checkout?.step == CHECKOUT_STEPS.SHIPPING || window.Shopify?.Checkout?.isOrderStatusPage){
    return true;
  } else if(window.Shopify?.Checkout?.step == CHECKOUT_STEPS.PAYMENT && synchronyGateway){ // Check if page loaded
    synchronyGatewayContainer = synchronyGateway.closest('.radio-wrapper').nextElementSibling;
    completeOrderBtn = document.querySelector('#continue_button');
    targetCheckoutForm = completeOrderBtn.closest('form');
    targetCheckoutForm.classList.add('target-checkout-form');
    taxesElem = document.querySelector('.total-line--taxes span');
    financedTotals = getFinancedOrderTotals();
    pageLoaded = true;

    return true;
  }

  if(localStorage.getItem('LC-shipping-rate') && window.Shopify?.Checkout?.step == 'shipping_method'){
    return true;
  }
  
  return false;
}

async function cleanSixtyMonthsOptionData(updateCartItemProperties = false){
  saveSynchronyDataParams(false);
  injectOrderAttributesFromLocalStorage(false);

  if(updateCartItemProperties){
    enableCheckoutBtn(false);
    enableFinancingOfferBtns(false);
    await updateCartItemsSixtyMonthsProperties(true);
    window.location.reload();
  }
}

function enableCheckoutBtn(enable = true){
  if(enable){
    completeOrderBtn.removeAttribute('disabled');
  } else {
    completeOrderBtn.setAttribute('disabled', true);
  }
}

function enableFinancingOfferBtns(enable = true){
  financingOfferBtns.forEach(($offerBtn) => {
    if(enable){
      $offerBtn.removeAttribute('disabled');
    } else {
      $offerBtn.setAttribute('disabled', true);
    }

    showLoadingOnFinancingOptions(!enable);
  });
}

function showCartConfirmationModal(show = true){
  if(show){
    document.querySelector('body').style.overflow = 'hidden';
    cartConfirmationModal.classList.remove('hidden');
    setTimeout(() => {
      cartConfirmationModal.classList.add('shown');
    }, 0);
  } else {
    cartConfirmationModal.classList.remove('shown');

    setTimeout(() => {
      document.querySelector('body').style.overflow = '';
      cartConfirmationModal.classList.add('hidden');
    }, 1000);
  }
  
}

function showCreditCardInputsOnly(){
  synchronyGatewayContainer.classList.add('hidden');
  synchronyGatewayContainer.previousElementSibling.classList.add('hidden');

  synchronyGatewayContainer.closest('fieldset').querySelector('[data-gateway-name="credit_card"]').classList.add('hidden');
  synchronyGatewayContainer.closest('fieldset').querySelector('.card-fields-container').classList.remove('hidden');
}

function prepareMutationObserver(callback, $target){
  const config = { attributes: false, childList: true, subtree: true };

  new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(async () => {
          observer.disconnect();
          afterMutationCacheSetup();
          await callback();
          prepareMutationObserver(callback, $target);
        }, 250);
        break;
      }
    }
  }).observe($target, config);
}

function groupWarranties(){
  var $checkoutItems = document.querySelectorAll('table.product-table tr.product:not(.hidden)'),
  warrantyGroups = [], warrantyName = '', targetCi, currentPrice = 0, warrantyPrice = 0;

  $checkoutItems.forEach(($ci) => {
    if(checkoutItemIsWarranty($ci)){
      warrantyName = $ci.querySelector('.product__description__name').innerText;
      targetCi = warrantyGroups.find(wg => wg.name == warrantyName);

      if(!targetCi){
        warrantyGroups.push(new CheckoutWarrantyGroup(warrantyName, $ci));
      } else {
        $ci.classList.add('hidden');

        warrantyPrice = $ci.querySelector('.product__price span').innerText;
        
        currentPrice = warrantyPriceToFloat(targetCi.$item.querySelector('.product__price span').innerText);
        if(warrantyPrice.toLowerCase() != 'free'){
          currentPrice += warrantyPriceToFloat(warrantyPrice);
        }
        targetCi.$item.querySelector('.product__price span').innerText = stringToPrice(currentPrice);
      }
    }
  });
}

function groupSixtyMonthsModalWarranties(cartConfirmationModal){
  let warrantyGroups = [], targetWarrantyGroup;
  
  cartConfirmationModal.querySelectorAll('.cart-item[data-is-warranty]').forEach(($cartItemWarrantyElem) => {
    let cartItemWarrantyPrice = $cartItemWarrantyElem.querySelector('.cart-item__price').innerText,
    cartItemWarrantyTitle = $cartItemWarrantyElem.querySelector('.cart-item__title').innerText;

    cartItemWarrantyPrice = cartItemWarrantyPrice.toUpperCase() == 'FREE' ? 0 : warrantyPriceToFloat(cartItemWarrantyPrice);
    targetWarrantyGroup = warrantyGroups.find(wg => wg.name == cartItemWarrantyTitle);
    
    if(!targetWarrantyGroup){
      warrantyGroups.push(new CheckoutWarrantyGroup(cartItemWarrantyTitle, $cartItemWarrantyElem, cartItemWarrantyPrice));
      targetWarrantyGroup = warrantyGroups[warrantyGroups.length-1];
      targetWarrantyGroup.$item.querySelector('.cart-item__price').innerText = stringToPrice(targetWarrantyGroup.currentPrice);
    } else {
      $cartItemWarrantyElem.classList.add('hidden');
      targetWarrantyGroup.currentPrice = performLimittedSum(targetWarrantyGroup.currentPrice, cartItemWarrantyPrice, getWarrantyStartingSku($cartItemWarrantyElem.dataset.sku));
      targetWarrantyGroup.$item.querySelector('.cart-item__price').innerText = stringToPrice(targetWarrantyGroup.currentPrice);
    }
  });
}

function checkoutItemIsWarranty($ci){
  var $properties = $ci.querySelectorAll('.product__description__property');

  for (let i = 0; i < $properties.length; i++) {
    if($properties[i].innerText.includes('appliedToProductUniqueId')){
      return true;
    }
  }

  return false;
}

/*
 * This function loops through through the cart
 * items and gets the totals sum taking into
 * account the warranty grouping limits and
 * financed months
 */
function getFinancedOrderTotals(offerCode = false){
  let originalSubtotal = 0, finalSubtotal = 0, warrantyGroups = [], targetWarrantyGroup, warrantyLimittedSum, taxesFloat;

  if(!cart){
    return;
  }
  
  cart.items.forEach((cartItem) => {
    if(cartItem.properties && cartItem.properties['warrantyUniqueId']){
      targetWarrantyGroup = warrantyGroups.find(wg => wg.sku == cartItem.sku);

      if(targetWarrantyGroup){
        warrantyLimittedSum = +performLimittedSum(+targetWarrantyGroup.sum, +(cartItem.originalPrice/100 * cartItem.quantity), getWarrantyStartingSku(cartItem.sku));
        warrantyGroups.find(wg => wg.sku == cartItem.sku).sum = warrantyLimittedSum;
      } else {
        warrantyLimittedSum = +(cartItem.finalPrice/100 * cartItem.quantity);
        warrantyGroups.push({sku: cartItem.sku, sum: warrantyLimittedSum});
      }
    } else {
      originalSubtotal += cartItem.originalPrice/100 * cartItem.quantity;
      finalSubtotal += cartItem.finalPrice/100 * cartItem.quantity;
    }
  });
  
  warrantyGroups.forEach((wg) => {
    originalSubtotal += wg.sum;
    finalSubtotal += wg.sum;
  });
  
  taxesFloat = priceToFloat(taxesElem.innerHTML);
  
  
  return new FinancedOrderTotals(originalSubtotal, finalSubtotal, taxesFloat, window.LC?.checkout.shippingPrice, offerCode);
}

function showLoadingOnFinancingOptions(show = true){
  let spinnerElem;
  financingOfferBtns.forEach((btn) => {
    spinnerElem = btn.querySelector('.kf-icon__spinner');
    if(show){
      spinnerElem.classList.remove('hidden');
    } else {
      spinnerElem.classList.add('hidden');
    }
  });
}

function gtmOrderCompleteEvent(offerCode){
  window.dataLayer?.push({
    event: "synchrony_finance",
    period: offerCode,
  });
}

/* --------------- Synchrony Data Management --------------- */

/**
 * Saves/removes synchronyData from local storage.
 * If remove, it also resets synchronyData variable.
 * 
 * @param {*} save 
 * @param {*} sixtyMonthsHash 
 */
function saveSynchronyDataParams(save = true, sixtyMonthsHash = false){
  let synchronyParams = {};

  if(!save){
    localStorage.removeItem('LC-synchrony');
    synchronyData = new synchronyLib.reset(synchronyData);
  } else {
    Object.getOwnPropertyNames(synchronyData.parameters).forEach((propName) => {
      if(synchronyData.parameters[propName].orderAttributeField){
        synchronyParams[propName] = synchronyData.parameters[propName];
      }
    });
  
    localStorage.setItem('LC-synchrony', JSON.stringify({
      parameters: synchronyParams,
      sixtyMonthsHash: sixtyMonthsHash
    }));
  }
}

/**
 * Gets localStorage Synchrony Data Parameters.
 * Should be used only one time on paymentOnDocumentLoaded event
 * and when needing to read sixtyMonthsHash value.
 * After loading, access the data through synchronyData.parameters.
 * 
 */
function loadSynchronyDataParams(){
  var localStorageSynchrony = localStorage.getItem('LC-synchrony');
  if(localStorageSynchrony){
    return JSON.parse(localStorageSynchrony);
  }
  
  return false;
}

function injectOrderAttributesFromLocalStorage(inject = true){
  let orderAttributeField = '', orderAttributeInput;

  if(inject && !synchronyData.parameters){
    return false;
  }

  removeOrderAttributesFromForms();

  if(inject && synchronyData.parameters?.authCode?.value){
    Object.getOwnPropertyNames(synchronyData.parameters).forEach((propName) => {
      orderAttributeField = synchronyData.parameters[propName].orderAttributeField;
  
      if(orderAttributeField){
        orderAttributeInput = targetCheckoutForm.querySelector(`[name="checkout[attributes][${orderAttributeField}]"]`);
  
        if(orderAttributeInput){
          orderAttributeInput.value = synchronyData.parameters[propName].value;
        } else {
          orderAttributeInput = stringToHtml(`
            <input type="hidden" name="checkout[attributes][${orderAttributeField}]" class="synchrony-order-attribute" value="${synchronyData.parameters[propName].value}">
          `);
  
          targetCheckoutForm.appendChild(orderAttributeInput);
        }
      }
    });
    
    return true;
  }

  return false;
}

function removeOrderAttributesFromForms(){
  document.querySelectorAll('.synchrony-order-attribute').forEach(synchronyOrderAttrElem => {
    synchronyOrderAttrElem.remove();
  });
}

/**
 * Currently used for 60 months
 */
function updateSynchronyDataWithLocalStorage(){
  Object.getOwnPropertyNames(synchronyData.parameters).forEach((propName) => {
    if(Object.prototype.hasOwnProperty.call(synchronyData.parameters, propName)){
      synchronyData.parameters[propName].value = synchronyData.parameters[propName].value;
    }
  });
}

/* --------------- Renders --------------- */

function renderFinancingOptions(){
  synchronyGatewayContainer.innerHTML = '';

  synchronyGatewayContainer.classList.add('synchrony-gateway-container');

  synchronyGatewayContainer.appendChild(stringToHtml(`
    <div class="financing-payment-details">
      <div class="financing-payment-details__info">
        <h3 class="financing-payment-details__info-header">${window.LC.synchrony.elegibleCart.header}</h3>
        <p class="financing-payment-details__info-subheader">${window.LC.synchrony.elegibleCart.subHeader}</p>
      </div>

      <img class="financing-payment-details__img" src="${window.LC.synchrony.elegibleCart.image.url}"/>
    </div>
  `));

  var shouldHideOfferOption;
  window.LC?.synchrony?.financingOptions?.forEach((financingOption) => {
    shouldHideOfferOption = false;
    
    // No option
    if(!financingOption.offerCode || financingOption.offerCode == '0' || financingOption.offerCode == 0){
      shouldHideOfferOption = true;
    }

    // 60 months
    if(financingOption.offerCode == '560' && financingOption.minimumCartSubtotal > window.LC?.checkout?.orderSubtotal){
      shouldHideOfferOption = true;
    }
    
    const financingOptionElem = stringToHtml(`
      <div class="financing-payment-offer__wrap ${shouldHideOfferOption ? 'hidden' : ''}" data-offer-code="${financingOption.offerCode}" ${financingOption.minimumCartsubtotal && financingOption.minimumCartsubtotal > window.LC?.checkout?.orderSubtotal}>
        <header class="financing-payment-offer__hdg">
          <h3 class="financing-payment-details__info-header">${financingOption.title}</h3>
        </header>
        <div class="financing-payment-offer__body">${financingOption.details}</div>
        <button id="btnOfferCode${financingOption.offerCode}" type="button" class="financing-payment-offer__btn btn js-offer-btn">
          <span>choose offer</span>
        </button>
      </div>
    `),
    financingOptionBtn = financingOptionElem.querySelector('.financing-payment-offer__btn');

    financingOptionBtn.appendChild(spinnerIcon.cloneNode(true));
    financingOptionBtn.addEventListener('click', financingOfferBtnOnClick);

    synchronyGatewayContainer.appendChild(financingOptionElem);
  });

  financingOfferBtns = synchronyGatewayContainer.querySelectorAll('.financing-payment-offer__btn');
}

async function createSixtyMonthsCartModal(){
  let oldConfirmCartBackdrop, shouldOnlyUpdate = false, cartItemsHtmlString = '';

  oldConfirmCartBackdrop = document.querySelector('#cart-confirmation-modal-backdrop');
  if(oldConfirmCartBackdrop){
    shouldOnlyUpdate = true;
  }

  if(!shouldOnlyUpdate){
    cart.items.forEach((cartItem) => {
      cartItemsHtmlString += `
        <div class="cart-item" ${cartItem.properties?.appliedToProductUniqueId ? 'data-is-warranty=""' : ''} data-sku="${cartItem.sku}">
          <div class="cart-item__img-container" style="background-image: url('${cartItem.imageUrl}')">
            <span class="cart-item__qty-bubble">${cartItem.quantity}</span>
          </div>
          <div class="cart-item__info">
            <span class="cart-item__title">${cartItem.title}</span>
            <span class="cart-item__price">${stringToPrice(cartItem.quantity * cartItem.originalPrice/100)}</span>
          </div>
        </div>  
      `;
    });
  
    cartConfirmationModal = stringToHtml(`
      <div id="cart-confirmation-modal-backdrop" class="hidden">
        <div id="cart-confirmation-modal">
          ${closeIconCopy.outerHTML}
          <h4 class="modal__title">${window.LC?.synchrony?.checkout?.sixtyMonthsPopup?.title}</h4>
          <p class="modal__description">${window.LC?.synchrony?.checkout?.sixtyMonthsPopup?.description}</p>
  
          <div class="modal-cart-items">${cartItemsHtmlString}</div>
  
          <hr/>
  
          <div class="modal-cart-totals">
            <div class="cart-totals__line">
              <span class="cart-totals__title">Subtotal:</span>
              <span id="totals__sixty-subtotal" class="cart-totals__value"></span>
            </div>
            <div class="cart-totals__line">
              <span class="cart-totals__title">Shipping:</span>
              <span id="totals__sixty-shipping" class="cart-totals__value"></span>
            </div>
            <div class="cart-totals__line">
              <span class="cart-totals__title">Taxes:</span>
              <span id="totals__sixty-taxes" class="cart-totals__value"></span>
            </div>
  
            <div class="cart-totals__line cart-total cart-total-space">
              <span class="cart-totals__title">Total:</span>
              <span id="totals__sixty-total" class="cart-totals__value"></span>
            </div>
            <div class="cart-totals__line cart-total">
              <span class="cart-totals__title">Downpayment:</span>
              <span id="totals__sixty-downpayment" class="cart-totals__value"></span>
            </div>
            <div class="cart-totals__line cart-total">
              <span class="cart-totals__title">Amount Financed:</span>
              <span id="totals__sixty-financed" class="cart-totals__value"></span>
            </div>
            <div class="cart-totals__line cart-installments">
              <span class="cart-totals__title">Monthly Payments (60):</span>
              <span id="totals__sixty-monthly" class="cart-totals__value"></span>
            </div>
          </div>
  
          <div class="modal-footer">
            <button class="cancel-btn button button__outline">cancel</button>
            <button class="confirm-btn button button__primary">confirm</button>
          </div>
        </div>
      </div>
    `);
    
    document.querySelector('body').appendChild(cartConfirmationModal);
    
    groupSixtyMonthsModalWarranties(cartConfirmationModal);
  }
  
  // Update totals
  if(financedTotals){
    cartConfirmationModal.querySelector('#totals__sixty-subtotal').innerText = stringToPrice(financedTotals.originalSubtotal);
    cartConfirmationModal.querySelector('#totals__sixty-taxes').innerText = stringToPrice(financedTotals.taxes);
    cartConfirmationModal.querySelector('#totals__sixty-shipping').innerText = stringToPrice(financedTotals.shipping);
    cartConfirmationModal.querySelector('#totals__sixty-total').innerText = stringToPrice(financedTotals.originalSubtotal + financedTotals.taxes + financedTotals.shipping);
    cartConfirmationModal.querySelector('#totals__sixty-downpayment').innerText = stringToPrice(financedTotals.downpayment);
    cartConfirmationModal.querySelector('#totals__sixty-financed').innerText = stringToPrice(financedTotals.financed);
    cartConfirmationModal.querySelector('#totals__sixty-monthly').innerText = stringToPrice(Math.ceil(financedTotals.financed / 60));
  }

  if(!shouldOnlyUpdate){
    // Events
    cartConfirmationModal.querySelector('.kf-icon__close').addEventListener('click', onCartConfirmationModalClose);
    cartConfirmationModal.querySelector('.cancel-btn').addEventListener('click', onCartConfirmationModalClose);
    cartConfirmationModal.querySelector('.confirm-btn').addEventListener('click', onCartConfirmationModalConfirm);
  }
}

/**
 * Changes prices and totals on page reload
 * when the Customer previously confirmed
 * the 60 months option cart modal
 */
function prepareSixtyMonthsOptionUI(){
  if(synchronyGatewayContainer){
    showCreditCardInputsOnly();
    renderTwentyPercentPaymentRequired();
    injectOrderAttributesFromLocalStorage(true);
    
    return true;
  }

  return false;
}

function renderTwentyPercentPaymentRequired(){
  if(document.querySelector('.order-summary__section--20-percent-required')){
    return;
  }
  
  var $msg = stringToHtml(`
    <div class="order-summary__section order-summary__section--20-percent-required">
      <span>Payment of 20% of the total order is required</span>
    </div>
  `);

  document.querySelector('.order-summary__section--total-lines').parentElement.appendChild($msg);
}

function renderSavingMessage(){
  var $savingMsg, $checkoutItems = document.querySelectorAll('table.product-table tr.product:not(.hidden)'),
  totalSavings = 0;

  if(document.querySelector('.total-line--savings')){
    return;
  }

  $checkoutItems.forEach(($item) => {
    var $reductionLine = $item.querySelector('.reduction-code'), saveLineText = '';

    if($reductionLine){
      saveLineText = $reductionLine.querySelector('.reduction-code__text').innerText;
      saveLineText = warrantyPriceToFloat(saveLineText);
      totalSavings += Math.abs(parseFloat(saveLineText));
    }
  });

  if(totalSavings > 0){
    $savingMsg = stringToHtml(`
    <table>
      <tbody>
        <tr class="total-line total-line--savings">
          <td class="saving-amount-msg">You are saving ${stringToPrice(totalSavings)} in this order</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    `);
    document.querySelector('.order-summary__section--total-lines tbody').appendChild($savingMsg.querySelector('tr'));
  }
}

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- On Load --------------- */

async function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  // let checkoutAttributes = document.querySelector('script[data-checkout-attributes]').innerText;
  // checkoutAttributes = JSON.parse(checkoutAttributes);
  // if(checkoutAttributes?.isValidZipCode == "false"){
  //   window.location.href = '/cart';
  // }

  pageLoaded = false;
  synchronyData = new synchronyLib.SynchronyData();
  spinnerIcon = document.querySelector('.kf-icon__spinner');

  if(window.Shopify?.Checkout?.step != CHECKOUT_STEPS.REVIEW && !loadSynchronyDataParams()?.sixtyMonthsHash){
    saveSynchronyDataParams(false);
  }

  if(window.Shopify?.Checkout?.step == CHECKOUT_STEPS.PAYMENT && !cart){
    cart = await getCart();
  }
  
  let afterMutationCacheSetupInterval = setInterval(async () => {
    if(afterMutationCacheSetup()){
      clearInterval(afterMutationCacheSetupInterval);
      /* ---------------- Events Setup ---------------- */

      /* ---------------- Initialization--------------- */

      switch(window.Shopify?.Checkout?.step){
        case CHECKOUT_STEPS.CONTACT:
          contactOnDocumentLoaded();
          break;
        case CHECKOUT_STEPS.SHIPPING:
          shippingOnDocumentLoaded();
          break;
        case CHECKOUT_STEPS.PAYMENT:
          await paymentOnDocumentLoaded();
          paymentOnMutationHappened();
          break;
      }

      prepareMutationObserver(async () => {
        switch(window.Shopify?.Checkout?.step){
          case CHECKOUT_STEPS.CONTACT:
            break;
          case CHECKOUT_STEPS.SHIPPING:
            break;
          case CHECKOUT_STEPS.PAYMENT:
            paymentOnMutationHappened();
            break;
        }

        // Global mutation

        groupWarranties();
        renderSavingMessage();

        removeStandarDeliveryIfNeeded();
      }, document.querySelector('body'));
      groupWarranties();

      pushGTMDataLayers();
    }
  }, 500);
}

function contactOnDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  /* ---------------- Events Setup ---------------- */

  /* ---------------- Initialization--------------- */
  
  injectOrderAttributesFromLocalStorage(false);
}

function shippingOnDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  /* ---------------- Events Setup ---------------- */

  /* ---------------- Initialization--------------- */

  injectOrderAttributesFromLocalStorage(false);

  removeStandarDeliveryIfNeeded();
}

async function paymentOnDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  
  let localStorageSynchronyDataParams;
  closeIconCopy = document.querySelector('.hidden-icons .kf-icon__close').cloneNode(true);
  closeIconCopy.classList.remove('hidden');

  /* --------------- Initialization--------------- */

  synchronyData = await synchronyLib.initAuth(onSynchronyModalClosedBefore);
  localStorageSynchronyDataParams = loadSynchronyDataParams()?.parameters;
  if(localStorageSynchronyDataParams){
    synchronyData.parameters = localStorageSynchronyDataParams;
    injectOrderAttributesFromLocalStorage(false);
  }

  if(await checkCurrentSixtyMonths()){
    updateSynchronyDataWithLocalStorage();
    prepareSixtyMonthsOptionUI();
    targetCheckoutForm.querySelector('[data-gateway-name="credit_card"] input').click();
  }
}

/* --------------- Other Events --------------- */

async function paymentOnMutationHappened(){
  let isThereAnyFinancingBtn = financingOfferBtns?.length > 0 ? true : false;

  if(pageLoaded){
    refreshEvents();
    
    if(!isThereAnyFinancingBtn){
      renderFinancingOptions();
    }
    
    if(await checkCurrentSixtyMonths()){
      prepareSixtyMonthsOptionUI();
    } else {
      injectOrderAttributesFromLocalStorage();
    }
  }
}

function gatewaySelectionChanged(e){
  var $gatewayRadio = e.currentTarget;

  if(!$gatewayRadio.checked){
    return;
  }

  if($gatewayRadio.value == window.LC?.synchrony?.gatewayId){
    enableCheckoutBtn(false);
  } else {
    saveSynchronyDataParams(false);
    injectOrderAttributesFromLocalStorage(false);
    enableCheckoutBtn(true);
  }
}

async function financingOfferBtnOnClick(e){
  let offerCode = e.currentTarget.closest('.financing-payment-offer__wrap').dataset.offerCode;
  financedTotals = getFinancedOrderTotals(offerCode);
  
  if(offerCode == '560' && !await checkCurrentSixtyMonths()){
    createSixtyMonthsCartModal();
    showCartConfirmationModal();
    return;
  }
  
  synchronyData.parameters.offerCode.value = offerCode;
  synchronyData.parameters.amount.value = financedTotals.financed;
  
  enableFinancingOfferBtns(false);
  synchronyLib.launchConsumerModal(synchronyData);
}

function onSynchronyModalClosedBefore(){
  synchronyLib.onSynchronyModalClosed(synchronyData, onSynchronyModalClosedAfter);
}

async function onSynchronyModalClosedAfter(res){
    var validResponse = false, authCode = '', accountNumber = '';

    // Validate based on current environment.
    // other env than production gives 403 for testing credentials.
    if (
      (window.LC?.environment === 'production' && res.StatusCode === '000') ||
      (window.LC?.environment !== 'production' && (res.StatusCode === '000' || res.StatusCode === '403'))
    ) {
      validResponse = true;
    }
    
    
    if (validResponse) {
      // attach more custom data from modal response
      if(window.LC?.environment == 'production'){
        accountNumber = res.AccountNumber;
        authCode =  res.AuthCode;
      } else {
        authCode = '999';
        accountNumber = '1111111111111111';
      }

      // Synchrony Modal response
      synchronyData.parameters.statusCode.value = res.StatusCode;
      synchronyData.parameters.statusMessage.value = res.StatusMessage;
      synchronyData.parameters.accountNumber.value = accountNumber;
      synchronyData.parameters.authCode.value = authCode;

      enableCheckoutBtn();
      enableFinancingOfferBtns(false);
      
      if(synchronyData.parameters.offerCode.value == '560'){
        enableCheckoutBtn(false);
        await prepareApprovedSixtyMonthsOption();
        window.location.reload();
      } else {
        saveSynchronyDataParams();
        injectOrderAttributesFromLocalStorage();
        gtmOrderCompleteEvent(synchronyData.parameters.offerCode.value);
        completeOrderBtn.click(); 
      }
    } else {
      console.error('Invalid response for synchrony checkout');
      enableFinancingOfferBtns(true);
      enableCheckoutBtn(false);
    }
}

function onCartConfirmationModalClose(){
  showCartConfirmationModal(false);
}

function onCartConfirmationModalConfirm(){
  showCartConfirmationModal(false);
  financedTotals = getFinancedOrderTotals('560');

  synchronyData.parameters.offerCode.value = '560';
  synchronyData.parameters.amount.value = financedTotals.financed;

  enableFinancingOfferBtns(false);
  synchronyLib.launchConsumerModal(synchronyData);
}

document.addEventListener("DOMContentLoaded", onDocumentLoaded);

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

class CheckoutWarrantyGroup {
  name;
  $item;
  currentPrice;

  constructor(name, $item, currentPrice = 0){
    this.name = name;
    this.$item = $item;
    this.currentPrice = currentPrice;
  }
}

class FinancedOrderTotals {
  originalSubtotal;
  finalSubtotal;
  taxes;
  shipping;
  originalTotal;
  finalTotal;
  months;
  downpayment;
  financed;
  monthly;
  
  constructor(originalSubtotal, finalSubtotal, taxes, shipping, offerCode = false){
    this.originalSubtotal = parseFloat(originalSubtotal.toFixed(2));
    this.finalSubtotal = parseFloat(finalSubtotal.toFixed(2));
    this.taxes = parseFloat(taxes.toFixed(2));
    this.shipping = parseFloat(shipping.toFixed(2));
    this.offerCode = offerCode;
    this.originalTotal = originalSubtotal + shipping + taxes;
    this.originalTotal = parseFloat(this.originalTotal.toFixed(2));
    this.finalTotal = finalSubtotal + shipping + taxes;
    this.finalTotal = parseFloat(this.finalTotal.toFixed(2));

    if(offerCode){
      this.months = window.LC?.synchrony?.financingOptions?.find(fo => fo.offerCode.toString() == offerCode.toString())?.months || 1;
  
      if(offerCode != 560){
        this.downpayment = 0;
        this.financed = this.finalTotal;
      } else {
        this.downpayment = parseFloat((this.originalSubtotal * .2 + this.taxes * .2 + this.shipping).toFixed(2));
        this.financed = parseFloat((this.originalSubtotal * .8 + this.taxes * .8).toFixed(2));
      }
  
      this.monthly = this.financed / this.months;
      this.monthly = parseFloat(this.monthly.toFixed(2));
    }
  }
}
