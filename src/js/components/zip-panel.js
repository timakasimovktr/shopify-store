import { getUserLocation } from '../utils/user-location'
import renderPickupRates from '../utils/zip-panel-renderPickups'
import moment from 'moment'

const state = {
  elements: {},
  isRatesLoaded: false,
  isMobile: window.matchMedia('(max-width: 993px)'),
  currentDate: moment().format('MMMM DD YYYY')
}

const cacheElements = async () => {
  state.elements = {
    ...state.elements,
    preferenceContainers: document.querySelectorAll('.delivery-preference__availability-date'),
    addToCartBtns: document.querySelectorAll('.product-form__submit'),
    preferenceValues: document.querySelectorAll('.delivery-preference__preference-value'),
    zipPanel: document.querySelector('.zip-panel__dropdown'),
    optionsContainer: document.querySelector('.zip-panel__optionBtns'),
    dropdownForm: document.querySelector('.zip-panel__delivery-content form'),
    zipInput: document.querySelector('.zip-panel__delivery-content input'),
    errorWrapper: document.querySelector('.zip-panel__error-wrapper'),
    ratesContainer: document.querySelector('.zip-panel__pickup-content'),
    productAvailabilityDate: document.getElementById('product-availability-date'),
    productAvailabilityTitle: document.getElementById('product-availability-title'),
    zipInputWrapper: document.querySelector('.zip-panel__code-input--wrapper'),
    selectedZipTitle: document.querySelector('.zip-panel__selected-zip'),
    pickupStoreEl: document.querySelectorAll('.delivery-preference__pickup-store'),
    deliveryBtn: document.getElementById('preference-btn--delivery'),
    pickupBtn: document.getElementById('preference-btn--pickup'),
  }
}

const addEventListeners = () => {
  state.elements.optionsContainer.addEventListener('change', onOptionSelect);
  state.elements.dropdownForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onSubmitZip()
  });
  state.elements.ratesContainer.addEventListener('click', onPickupRateSelect)
}

export const init = async () => {
  cacheElements();
  addEventListeners();
  updateFoundZip();
  updatePreselectOption();
  updatePreselectedZipCode();
  updateZipValueIndicator();
  updateAddToCartBtn();
  await renderPickupRates(state.elements.ratesContainer);
}

export const getSelectedPreferenceValue = () => {
  const currentDestination = localStorage.getItem('user-delivery-preference');
  if (!currentDestination) {
    localStorage.setItem('user-delivery-preference', 'delivery')
  }
  return localStorage.getItem(`selected-${currentDestination}`);
}

export const toggleZipPanelOnAddToCart = () => {
  const selectedpreferenceValue = getSelectedPreferenceValue();
  if (!selectedpreferenceValue && state.isMobile.matches) {
    state.elements.zipPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return selectedpreferenceValue;
}

const updateAddToCartBtn = () => {
  const selectedpreferenceValue = getSelectedPreferenceValue();
  state.elements.addToCartBtns.forEach(btn => {
    btn.classList[
      selectedpreferenceValue ? 
      "remove" : 
      "add"
    ]('select-preference')
  })
  state.elements.addToCartBtns.forEach(btn => btn.disabled = false);
}

const updateError = (errorValue) => {
  state.elements.zipInputWrapper.classList.remove('loading')
  if (errorValue) {
    state.elements.errorWrapper.setAttribute('data-error', errorValue);
  } else {
    state.elements.errorWrapper.removeAttribute('data-error');
  }
}

const resetPreferences = () => {
  const formatObj = window.productAvailability?.format

  localStorage.removeItem('selected-delivery');
  localStorage.removeItem('selected-pickup');
  localStorage.removeItem('selected-pickup-title');
  localStorage.setItem('user-delivery-preference', 'delivery')
  updateZipValueIndicator(null, false);
  updateAddToCartBtn();

  state.elements.productAvailabilityDate.textContent = "";
  state.elements.productAvailabilityTitle.textContent = 
    formatObj?.title?.availableNow || "Available Now!";
}

const updateZipValueIndicator = (options, setOption=true) => {
  const currentZip = options?.zip || localStorage.getItem('selected-delivery');
  const currentDestination = options?.destination || localStorage.getItem('user-delivery-preference')
  let label = options?.label;

  if (!label) {
    if (currentDestination == 'delivery') {
      label = currentZip ? `Ship to <span>${currentZip}</span>` : "Delivery"
    } else {
      label = "<span>Pickup In Store</span"
    }
  }
  state.elements.preferenceContainers.forEach(container => container.classList.remove('hidden'));
  state.elements.preferenceValues.forEach(el => el.innerHTML = label || "");
  state.elements.pickupStoreEl.forEach(el => el.textContent = localStorage.getItem('selected-pickup-title') || '')
  state.elements.preferenceContainers.forEach(container => container.dataset.selectedOption = currentDestination || "delivery")
}

const updatePreselectOption = () => {
  const currentDestination = localStorage.getItem('user-delivery-preference') || 'delivery'
  const optionEl = state.elements[`${currentDestination}Btn`]
  onOptionSelect({ target:  optionEl })
}

const updatePreselectedZipCode = () => {
  state.elements.zipInput.value = localStorage.getItem('selected-delivery');
}

const onSubmitZip = async () => {
  const inputZip = state.elements.zipInput.value;
  const currentZipCode = localStorage.getItem("selected-delivery")
  updateError();

  if (!inputZip) {
    updateError('valid');
    resetPreferences()
    return;
  };

  if (inputZip === currentZipCode) return;

  state.elements.zipInputWrapper.classList.add('loading')

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${inputZip}`);
    const data = await response.json();
    if (!data?.places) {
      updateError('valid');
      resetPreferences();
      return;
    }
    const isFlorida = data.places[0].state == 'Florida';
    const isDeliverableArea = window.zipCodes.includes(inputZip);
    if (!isFlorida || !isDeliverableArea) {
      updateError('area');
      resetPreferences();
      return;
    }
    state.elements.zipInputWrapper.classList.remove('loading')
    localStorage.setItem('selected-delivery', inputZip);
    localStorage.setItem('user-delivery-preference', 'delivery')
    updateZipValueIndicator({label: `Ship to <span>${inputZip}</span>`, destination: 'delivery'})
    updateAddToCartBtn();
    await renderPickupRates(state.elements.ratesContainer);

  } catch (err) {
    console.error(err)
    updateError('rest');
    resetPreferences();
  }
}

const preselectPickupRate = (optionValue) => {
  const selectedPickup = localStorage.getItem('selected-pickup');
  if (selectedPickup || optionValue != 'pickup') return;
  const pickupEl = document.querySelector(`.shipping-rate-option:not(.unavailable-rate)`);
  onPickupRateSelect({ target: pickupEl });
};

const onOptionSelect = (e) => {
  const optionValue = e.target.dataset?.value;
  const formatedAvailability = window.productAvailability?.dates?.[optionValue];
  if (!optionValue) return;
  state.elements.optionsContainer.dataset.selectedOption = optionValue;
  e.target.checked = true
  updateZipValueIndicator({destination: optionValue});
  preselectPickupRate(optionValue);
  localStorage.setItem('user-delivery-preference', optionValue);
  if (formatedAvailability && state.elements.productAvailabilityDate) {
    state.elements.productAvailabilityTitle.textContent = formatedAvailability.title;
    state.elements.productAvailabilityDate.innerHTML = formatedAvailability.message;
    state.elements.productAvailabilityDate.classList.remove("skeleton-loading");
    state.elements.productAvailabilityTitle.classList.remove("skeleton-loading");
  }
  updateAddToCartBtn();
}

const onPickupRateSelect = (e) => {
  const pickupEl = e.target.closest('label');
  const pickupAvailabilityDate = pickupEl?.dataset?.availabilityDate;
  const pickupAvailabilityTitle = pickupEl?.dataset?.availabilityTitle;
  const zoneId = pickupEl?.dataset?.zoneId;
  const rateTitle = pickupEl?.querySelector('.shipping-rate-option__title')?.textContent;
  const pickupZip = pickupEl?.dataset?.zipCode;
  if (!zoneId || !rateTitle) return
  localStorage.setItem('selected-pickup', zoneId);
  localStorage.setItem('selected-pickup-title', rateTitle);
  localStorage.setItem('selected-pickup-zip', pickupZip);
  updateAddToCartBtn();
  state.elements.pickupStoreEl.forEach(el => el.textContent = localStorage.getItem('selected-pickup-title') || '')
  if (state.elements.productAvailabilityDate) {
    state.elements.productAvailabilityDate.textContent = pickupAvailabilityDate || "";
    state.elements.productAvailabilityTitle.textContent = pickupAvailabilityTitle || "";
    state.elements.productAvailabilityDate.classList.remove("skeleton-loading");
    state.elements.productAvailabilityTitle.classList.remove("skeleton-loading");
    window.productAvailability.dates.pickup = {
      title: pickupAvailabilityTitle,
      message: pickupAvailabilityDate,
    }
  }
}

const updateFoundZip = async () => {
  const selectedZip = localStorage.getItem('selected-delivery');
  if (selectedZip) return;
  const foundLocation = await getUserLocation();
  if (foundLocation?.country_code != "US" || foundLocation?.country_code != "USA") return;
  const foundZip = foundLocation.zip;
  state.elements.zipInput.value = foundZip;
  onSubmitZip()
}


export default init;