import moment from "moment"
const EXCLUDED_VENDORS = ["NOUR - NOURISON HOME"]
const AVAILABILITY_ENDPOINT = "/apps/kf-middleware/api/v1/shipping/get-product-availability"

const moduleState = {
  pickupAvailability: null,
}

const formatAvailabilityDate = (date) => {
  if (!Boolean(date)) return date;
  const formatObj = window?.productAvailability?.format
  const availabilityDate = moment(date, 'YYYY-MM-DD')
  const availabilityThresholdDate = moment().add(formatObj?.threshold, 'day')
  const daysDifference = availabilityDate.diff(availabilityThresholdDate)
  const formatedAvailability = {
    message: formatObj?.message?.availableNow || availabilityDate.format('MMMM DD YYYY'),
    title: formatObj?.title?.availableNow,
  }
  if (daysDifference > 0) {
    formatedAvailability.message = formatObj?.message?.preOrder || availabilityDate.format('MMMM DD YYYY');
    formatedAvailability.title = formatObj?.title?.preOrder;
  }
  formatedAvailability.message = formatedAvailability.message.replace('[[ date ]]', availabilityDate.format('MMMM DD YYYY'))
  return formatedAvailability;
}

export const getProductAvailability = async (url, params) => {
  const availabilityParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      availabilityParams.set(key, value)
    })
  }

  const response = await fetch(`${url}?${availabilityParams.toString()}`);
  const data = await response.json();
  return data;
}

const renderPickupRatesMarkup = (availabilityObj) => {
  if (!availabilityObj?.pickupRates) return "";
  const firstAvailableRate = availabilityObj?.pickupRates
    .filter(rate => Boolean(rate.availabilityDate))[0]?.zoneId;
  const userSelectedRateZip = localStorage.getItem('selected-pickup-zip');
  const userSelectedRate = availabilityObj?.pickupRates
    .filter(rate => rate.zipCode == userSelectedRateZip)[0]?.zoneId;
  const preselectedRate = userSelectedRate || firstAvailableRate
  const markup = availabilityObj.pickupRates.map((rate, index) => {
    const isAvailable = Boolean(rate.availabilityDate)
    const formatedAvailability = formatAvailabilityDate(rate.availabilityDate)
    if (index == 0) {
      moduleState.pickupAvailability = formatedAvailability
    }
    return `
    <label 
      for="shipping-option-${index}" 
      class="shipping-rate-option ${isAvailable ? "" : "unavailable-rate"}"
      data-zone-id="${rate.zoneId}"
      data-state-code="${rate.stateCode}"
      data-zip-code="${rate.zipCode}"
      data-availability-date="${formatedAvailability.message}"
      data-availability-title="${formatedAvailability.title}"
    >
      <input id="shipping-option-${index}"
        type="radio"
        class="kf-input"
        name="shipping-rate-option"
        ${preselectedRate === rate.zoneId ? "checked=true" : ""}
      >
      <span class="shipping-rate-option__title">${rate.address}</span>
    </label>
    `
  })

  return markup.join(' ')
}

const toggleIndicatorLoaders = (state, action, className='skeleton-loading') => {
  state.productAvailabilityIndicator.classList[action](className);
  state.productAvailabilityTitle.classList[action](className);
}

const updateProductAvailabilityUI = (availabilityDates, shippingOption, state) => {
  state = {
    ...state,
    productAvailabilityIndicator: document.getElementById('product-availability-date'),
    productAvailabilityTitle: document.getElementById('product-availability-title'),
  }

  let datesObj = { ...availabilityDates };
  if (!datesObj.pickup) {
    datesObj.pickup = {
      message: moduleState.pickupAvailability.message || '',
      title: moduleState.pickupAvailability.title || window.productAvailability?.format?.title?.availableNow,
    }
  };
  if (!datesObj.delivery) {
    datesObj.delivery = {
      message: '',
      title: window.productAvailability?.format?.title?.availableNow,
    } 
  }
  const availabilityObj = datesObj[shippingOption];
  state.productAvailabilityTitle.textContent = availabilityObj.title
  state.productAvailabilityIndicator.innerHTML = availabilityObj.message;
  toggleIndicatorLoaders(state, 'remove')
  
  window.productAvailability = {
    ...(window.productAvailability || {}),
    dates: datesObj
  }
}

export const updateProductAvailabilityDate = (availabilityObj, state) => {
  if (!availabilityObj) return;
  const formatObj = window.productAvailability.format;
  let shippingOption = localStorage.getItem('user-delivery-preference');
  if (!shippingOption) {
    shippingOption = 'pickup'
    localStorage.setItem('user-delivery-preference', 'pickup')
  }
  const selectedPickup = localStorage.getItem('selected-pickup');
  const selectedDelivery = localStorage.getItem('selected-delivery');
  const availabilityDates = {
    pickup: null,
    delivery: null,
  };
  if (selectedPickup) {
    availabilityDates.pickup = formatAvailabilityDate(
      availabilityObj.pickupRates.filter(rate => {
        return (Boolean(rate.availabilityDate) && rate.zoneId == selectedPickup)
      })?.[0]?.availabilityDate
    )
  } 
  if (selectedDelivery) {
    availabilityDates.delivery = formatAvailabilityDate(availabilityObj.availabilityDate);
  }
  if (selectedDelivery && availabilityObj.deliveryRates?.[0]?.zoneId === "SD" && !state.isVendorExcluded) {
    availabilityDates.delivery = {
      title: "",
      message: formatObj.message.sd,
      sdLink: formatObj.sdLink
    }
  }
  updateProductAvailabilityUI(availabilityDates, shippingOption, state)
}

export const cacheState = (product) => {
  let state = {};
  if (!product) return state;
  state = {
    productAvailabilityIndicator: document.getElementById('product-availability-date'),
    productAvailabilityTitle: document.getElementById('product-availability-title'),
    isVendorExcluded: EXCLUDED_VENDORS.includes(product.vendor),
    availabilityParams: { 
      zipCode: localStorage.getItem('selected-delivery'), 
      qty: 1, 
      sku: product.sku, 
      price: product.price,
      deliveryType: 'D'
    },
  }
  return state;
}

const renderPickupRates = async (parentContainer) => {
  const product = window?.product;
  let state = cacheState(product);
  product && toggleIndicatorLoaders(state, 'add');
  const availabilityObj = await getProductAvailability(AVAILABILITY_ENDPOINT, state.availabilityParams);
  parentContainer.innerHTML = renderPickupRatesMarkup(availabilityObj);
  parentContainer.classList.remove('loading');
  product && updateProductAvailabilityDate(availabilityObj, state);
}

export default renderPickupRates;