import { stringToHtml, stringToPrice } from "./parsers";

function shippingRateOptionIsPickup(groupedRateServiceName){
  return groupedRateServiceName.toLowerCase().includes('pickup');
}

export function renderShippingRateOptions(
  groupedShippingRates, 
  pickupMethodSelected, 
  ratesContainer, 
  firstChecked=false
  ) {
  groupedShippingRates.forEach((groupedShippingRate, i) => {
    const rateIsPickup = shippingRateOptionIsPickup(groupedShippingRate.serviceName);
    const shouldHideRate = (rateIsPickup && !pickupMethodSelected) || (!rateIsPickup && pickupMethodSelected);
    const totalShippingPrice = groupedShippingRate.rates[0].totalPrice;
    const price = isNaN(totalShippingPrice) ? totalShippingPrice : stringToPrice(groupedShippingRate.rates[0].totalPrice/100);
    const rateOptionString = `
    <label for="shipping-option-${i}" class="shipping-rate-option ${shouldHideRate ? 'hidden' : ''}">
      <input id="shipping-option-${i}"
        type="radio"
        class="kf-input"
        name="shipping-rate-option"
        data-service-code="${groupedShippingRate.rates[0].serviceCode}"
        data-service-name="${groupedShippingRate.serviceName}"
        ${firstChecked && i==0 ? "checked=checked" : ""}
      >
      <span class="shipping-rate-option__title">${groupedShippingRate.serviceName} - <span class="shipping-rate-option__price">${price}</span></span>
    </label>
    `;

    ratesContainer.appendChild(stringToHtml(rateOptionString));
  });
}