'use strict';
import LineItem from "./components/cart-lineitem-class";
import { onDocumentReady } from "./utils/dom";
import { stringToPrice } from "./utils/parsers";
import { validateZip, getRatesRequestBody } from './utils/user-location';
import { getCart } from "./lib/cart";
import { getDeliveryDateOfRate, groupDeliveryRates } from './lib/shipping-rates';
import { debounce } from "./utils/performance";
import moment from 'moment';
import { fetchWithProperty } from './utils/performance'

const GET_RATES_URL = '/apps/kf-middleware/api/v1/shipping/get-rates';
const GET_INDIVIDUAL_RATES_URL = '/apps/kf-middleware/api/v1/shipping/get-individual-rates';

const state = {
  elements: {},
  preselectRatesObj: {},
  atpDates: [],
  shippingPreference: 'delivery',
  selectedRate: null,
}

const cacheState = () => {
  state.elements = {
    ...state.elements,
    subtotalPrice: document.getElementById("subtotal-price"),
    lineItems: Array.from(document.querySelectorAll('.cart-item')),
    inputZipCode: document.getElementById("zip-code-input"),
    checkoutBtn: document.querySelector('.checkout-btn'),
    shippingRatesContainer: document.querySelector('.shipping-rates'),	
    deliveryRates: document.getElementById('delivery-rates'),
    pickupRates: document.getElementById('pickup-rates'),
    availabilityRadioBtns: document.querySelectorAll(".availability__radio-btns input[type='radio']"),
    postalCodeSpinner: document.querySelector('.postalCodeSpinner'),
    cartAvailabilityMsg: document.getElementById('cart-availability-msg'),
    cartItemsContainerEl: document.querySelector('#cart-page .cart-items'),
    iconBubble: document.querySelector('#cart-icon-bubble .cart-count-bubble'),
    zipErrorsContainer: document.querySelector('.zip-error-msgs'),
    zipForm: document.getElementById('zipCode-form'),
  }
  state.cartSectionURL = `${window.location.origin}/${window.location.pathname}?section_id=${window?.Cart.section}`;
  state.parser = new DOMParser;
};

const addEventListeners = () => {
  state.elements.zipForm.addEventListener('submit', onSubmitZip);
  state.elements.availabilityRadioBtns.forEach(radioBtn => {
    radioBtn.addEventListener('change', onOptionSelect)
  })
  state.elements.checkoutBtn.addEventListener('click', redirectToCheckout);
  state.elements.deliveryRates.addEventListener('click', onRateSelect);
  state.elements.pickupRates.addEventListener('click', onRateSelect);
};

const updateZipErrMsg = (code, save=true) => {
  if (code) {
    state.elements.zipErrorsContainer.dataset.zipError = code;
    if (save) {
      window.Cart.errorMsg = code;
    }
  }
  return state.elements.zipErrorsContainer.dataset.zipError
}

const toggleLoading = (isLoading) => {
  document.body.classList.toggle('cart-loading', isLoading);
  window.Cart.isLoading = isLoading;
}

const updateCartNote = async () => {
  const noteObj = {note: `DeliveryDate: ${moment(state.mainDeliveryDate).format('YYYY-MM-DD')}`}
  await fetchCartData('/cart/update.js', noteObj)
}

const redirectToCheckout = async (e) => {
  if (window.Cart.isLoading) {
    e.preventDefault();
    return;
  }
  e.target.setAttribute('disabled', true);	
  await updateCartNote();
  location.href = '/checkout';	
}

const onSubmitZip = async (e) => {
  e && e.preventDefault();
  const inputZip = state.elements.inputZipCode.value;
  updateZipErrMsg('valid');
  if (state.currentZip === inputZip) return;
  if(!inputZip.length) {
    updateZipErrMsg('invalid');
    return;
  }
  const zipValidityCode = await validateZip(inputZip);
  updateZipErrMsg(zipValidityCode);
  if (zipValidityCode === 'valid') {
    await updatePreselectZipValue();
    await getProductsAvailability();
    state.elements.checkoutBtn.removeAttribute('disabled');
  } else {
    state.elements.checkoutBtn.setAttribute('disabled', true);
  }
}

const resetRates = () => {
  state.elements.deliveryRates.innerHTML = "";
  state.elements.pickupRates.innerHTML = "";
  state.elements.cartAvailabilityMsg.innerHTML = "";
  state.mainDeliveryDate = null;
} 

const updatePreselectZipValue = async () => {
  const { inputZipCode } = state.elements;
  const shippingPreference = localStorage.getItem('user-delivery-preference') || 'delivery';
  const zipCodeKey = `selected-${shippingPreference}${shippingPreference === 'pickup' ? "-zip" : ""}`;
  const inputZipCodeValue = localStorage.getItem(zipCodeKey);
  if (!inputZipCodeValue) return;
  if (!inputZipCode.value) {	
    inputZipCode.value = inputZipCodeValue;	
    await onSubmitZip();
  } else if (inputZipCode.value !== inputZipCodeValue) {	
    localStorage.setItem(zipCodeKey, inputZipCode.value);
    state.currentZip = inputZipCode.value;
  }
}

const updateZipOnOptionChange = async () => {
  const shippingPreference = localStorage.getItem('user-delivery-preference') || 'delivery';
  const zipCodeKey = `selected-${shippingPreference}${shippingPreference === 'pickup' ? "-zip" : ""}`;
  const inputZipCodeValue = localStorage.getItem(zipCodeKey);
  if (!inputZipCodeValue || inputZipCodeValue == state.elements.inputZipCode.value) return;
  state.elements.inputZipCode.value = inputZipCodeValue;
  await onSubmitZip();
}

const getProductsAvailability = async () => {
  const eneteredZip = state.elements.inputZipCode.value
  if (!eneteredZip) return;
  toggleLoading(true);
  resetRates();
  const cart = await getCart();
  const raData = await getCartRates(eneteredZip, cart);
  raData && renderRatesAndAtpDates(raData);
  toggleLoading(false);
};

const getCartRates = async (zipCode, cart) => {
  const items = getProductLineItems(cart);
  const body = getRatesRequestBody(zipCode, items);
  const promises = [
    fetchWithProperty(
      GET_RATES_URL, 
      body, 
      'atpDate', 
      3, 
      500, 
      () => {
        updateZipErrMsg('other');
        state.preselectRatesObj.err = 'other'
        state.elements.checkoutBtn.removeAttribute('disabled');
      }
    ), 
    fetchCartData(GET_INDIVIDUAL_RATES_URL, body)
  ];
  const [
    ratesResponse, 
    individualRatesResponse
  ] = await Promise.all(promises)
    .then(([data1, data2]) => [data1, data2])

  if (!ratesResponse || !individualRatesResponse) return;
  state.preselectRatesObj.err = 'no-rates'
  ratesResponse.rateGroups = groupDeliveryRates(ratesResponse.rates);
  return prepareRates(ratesResponse, items, individualRatesResponse);
}

export const getProductLineItems = (cart) => {
  const items = cart.items.filter(item => !item.properties.warrantyUniqueId);
  return items.map(item => {
    return {
      id: item.id,
      quantity: item.quantity,
      key: item.key,
      price: item.finalPrice,
      sku: item.sku,
    }
  });
}

export const fetchCartData = async (url, data) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
};

export const prepareRates = (raResponse, items, individualRatesResponse) => {
  const pickupRates = raResponse.rateGroups
    .filter(rate => {
      return rate.serviceName.toLowerCase().includes('pickup')
    }); 
  let deliveryRates = raResponse.rateGroups
    .filter(rate => {
      return rate.serviceName.toLowerCase().includes('delivery')
    }); 
  if (deliveryRates.length > 1) {
    deliveryRates = deliveryRates
      .filter(rate => {
        return !rate.serviceName.toLowerCase().includes('standard')
      })
  };

  const atpDateLines = items.map((item, index) => ({
    atpDateLine: individualRatesResponse[index].atpDate,
    itemKey: item.key,
  }));
  
  return {
    deliveryRates,
    pickupRates,
    atpDateLines,
    atpDate: raResponse.atpDate,
  };
}

const renderRates = (rates, container) => {
  let preselectedRate;
  const ratesOption = container.dataset.option;
  preselectedRate = preselectRates(rates, ratesOption);
  if(ratesOption == state.elements.shippingRatesContainer.dataset.selectedOption){
    updateSelectedRate(preselectedRate?.rates[0].serviceCode, preselectedRate?.serviceName);
  }
  const ratesHtml = rates.map((rate, index) => {
    const optionId = `shipping-option-${ratesOption}-${index}`;
    const isChecked = preselectedRate?.serviceName === rate.serviceName ? 'checked=true' : '';
    const price = rate.rates[0].totalPrice === 0 ? 'Free' : stringToPrice(rate.rates[0].totalPrice / 100);
    
    return `
      <label for="${optionId}" class="shipping-rate-option">
        <input id="${optionId}"
          type="radio"
          class="kf-input"
          name="shipping-rate-option"
          data-service-code="${rate.rates[0].serviceCode}"
          data-service-name="${rate.serviceName}"
          data-rate-option="${ratesOption}"
          data-zone-id="${rate.zoneId}"
          data-zip-code="${rate.zipCode}"
          ${isChecked}
        >
        <span class="shipping-rate-option__title">${rate.serviceName} - <span class="shipping-rate-option__price">${price}</span></span>
      </label>
    `;
  }).join('');


  container.innerHTML = ratesHtml;
}

const renderAtpDateLines = (atpDateLines) => {
  atpDateLines.forEach(item => {
    const itemEl = state.elements.cartItemsContainerEl.querySelector(`[data-key="${item.itemKey}"]`);
    const availabilityEl = itemEl.querySelector('.cart-item__availability-date');
    const index = itemEl.dataset?.line - 1;
    if (!availabilityEl) return;
    availabilityEl.innerHTML = formatAvailabilityMsg(item.atpDateLine);
    state.atpDates.push({
      index,
      date: item.atpDateLine
    })
  });
}

const formatAvailabilityMsg = (date) => {
  const { availabilityThreshold, preOrderDateMsg, availableNowDateMsg } = window.Cart.format;
  const availabilityDate = moment(date);
  const thresholdDay = moment().add(+availabilityThreshold, 'day');
  const daysDifference = availabilityDate.diff(thresholdDay, 'day')
  if (daysDifference > 0) {
    return preOrderDateMsg.replace('[[ date ]]', availabilityDate.format('MM/DD/YYYY'))
  } else {
    return availableNowDateMsg.replace('[[ date ]]', availabilityDate.format('MM/DD/YYYY'))
  }
}

const preselectRates = (rates, ratesOption) => {
  const whiteGloveRate = rates.find(rate => {
    return rate.serviceName.toLowerCase().includes('white glove')
  });
  const firstAvailableRate = rates[0];
  let selectedRate = whiteGloveRate || firstAvailableRate;

  if (ratesOption == 'pickup') {
    const selectedZoneid = localStorage.getItem('selected-pickup');
    const selectedPickup = rates.find(rate => {
      return rate?.zoneId == selectedZoneid
    })

    if (selectedPickup) {
      selectedRate = selectedPickup
    }
  }
  if (ratesOption && selectedRate) {
    state.preselectRatesObj[ratesOption] = {
      serviceName: selectedRate.serviceName, 
      serviceCode: selectedRate.rates[0].serviceCode 
    }
  }
  return selectedRate;
}

const renderRatesAndAtpDates = (raData) => {
  const { deliveryRates, pickupRates, atpDateLines, atpDate } = raData;
  state.mainDeliveryDate = atpDate;
  state.elements.cartAvailabilityMsg.classList.add('hidden');
  updateZipErrMsg('valid');

  if (deliveryRates.length === 0 && pickupRates.length === 0) {
    updateZipErrMsg('no-rates');
    return;
  }
  renderRates(deliveryRates, state.elements.deliveryRates);
  renderRates(pickupRates, state.elements.pickupRates);
  renderAtpDateLines(atpDateLines);
}

const onRateSelect = (e) => {
  const {serviceCode, serviceName, rateOption, zipCode, zoneId} = e?.target?.dataset || {};
  state.preselectRatesObj[rateOption] = { serviceCode, serviceName };
  updateSelectedRate(serviceCode, serviceName);
  if (rateOption == 'pickup') {
    localStorage.setItem('selected-pickup', zoneId);
    localStorage.setItem('selected-pickup-zip', zipCode)
  }
} 

const updateSelectedRate = (serviceCode, serviceName) => {
  const { cartAvailabilityMsg } = state.elements;
  if(serviceCode && serviceName){
    localStorage.setItem('LC-shipping-rate', serviceCode);
    const deliveryDate = getDeliveryDateOfRate(serviceCode, serviceName) || state.mainDeliveryDate;
    if(!deliveryDate){
      cartAvailabilityMsg.classList.add('hidden');
      return;
    }
    const deliveryDateFormatted = moment(deliveryDate).format('MM/DD/YYYY');
    state.mainDeliveryDate = deliveryDateFormatted;
    cartAvailabilityMsg.classList.remove('hidden');
    cartAvailabilityMsg.innerHTML = `All items will be available together on: ${deliveryDateFormatted}`;
  }
} 

const onOptionSelect = async (e) => {
  const { shippingRatesContainer } = state.elements;
  const selectedOption = e.target.value;
  shippingRatesContainer.dataset.selectedOption = selectedOption;
  state.shippingPreference = selectedOption;
  localStorage.setItem('user-delivery-preference', selectedOption);
  await updateZipOnOptionChange();
  const selectedRate = state.preselectRatesObj[selectedOption];
  if (selectedRate) {
    const { serviceName, serviceCode } = selectedRate;
    updateSelectedRate(serviceCode, serviceName);
    updateZipErrMsg(window.Cart?.errorMsg || 'valid');
  } else {
    updateZipErrMsg(state.preselectRatesObj.err || 'no-rates', false);
    state.elements.cartAvailabilityMsg.classList.add('hidden');
  }
};

export const rerenderLineItems = debounce(
  async () => {
    const { 
      iconBubble, 
      subtotalPrice, 
      cartItemsContainerEl,
    } = state.elements;
    try {
      const response = await fetch(state.cartSectionURL);
      const markupStr = await response.text();
      const parsedMarkup = state.parser.parseFromString(markupStr, 'text/html');
      const newLineItems = parsedMarkup.querySelectorAll('.cart-item:not(.hidden)');
      const cartItemsLength = parsedMarkup.getElementById('cart-items-count')?.innerHTML;
      const subtotal = parsedMarkup.getElementById("subtotal-price")?.innerHTML;
      
      if (!newLineItems.length) {
        document.body.classList.add('empty-cart');
      }
      iconBubble.innerHTML = cartItemsLength;
      subtotalPrice.innerHTML = subtotal;
      cartItemsContainerEl.innerHTML = "";
      newLineItems.forEach(item => {
        new LineItem(item);
        cartItemsContainerEl.insertAdjacentElement('beforeend', item)
      })
    } catch (error) {
      console.error(error)
    } finally {
      getProductsAvailability();
    }
  }, 350
) 

const preselectShippingPreferences = async () => {
  const shippingPreference = localStorage.getItem('user-delivery-preference')
  if (shippingPreference) {
    state.elements.availabilityRadioBtns.forEach(btn => {
      btn.checked = btn.value === shippingPreference
    })
    await onOptionSelect({target: {value: shippingPreference}})
  }
}

const init = async () => {
  cacheState();
  addEventListeners();
  await preselectShippingPreferences();
  state.elements.lineItems.forEach(item => new LineItem(item));
}

onDocumentReady(() => {
  init();
})
