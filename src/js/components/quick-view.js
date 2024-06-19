"use strict";

import Glide from '@glidejs/glide';
import { onDocumentReady } from "../utils/dom";
import { addToCart, AddToCartParam } from "../lib/cart";
import { refreshMinicart } from "./minicart";
import { getProductAvailability, updateProductAvailabilityDate } from "../utils/zip-panel-renderPickups";
import { getProductBySku } from "../utils/product-query";
import { getProtectedPackToAddToCart, learnMoreOnClick } from "../lib/warranties";
import { init, toggleZipPanelOnAddToCart } from "./zip-panel";

const AVAILABILITY_ENDPOINT = "/apps/kf-middleware/api/v1/shipping/get-product-availability";
const PRODUCT_IMAGES_GLIDE_CAROUSEL_SETTINGS = {
  type: "carousel",
  perView: 1,
  gap: 20,
};

const state = {
  availabilityParams: {
    qty: 1,
    deliveryType: "D",
  },
  productImagesGlideInstance: null,
};

const cacheState = () => {
  state.elements = {
    ...state.elements,
    quickViewContainer: document.querySelector('.quick-view-container'),
    closeQuickViewBtn: document.querySelector('.quick-view-close'),
  }
}

const showQuickViewAvailability = async () => {
  state.availabilityParams = {
    ...state.availabilityParams,
    zipCode: localStorage.getItem('userZipCode') || document.getElementById("nearest-store-name")?.dataset?.zipcode,
    sku: window.product.sku,
    price: window.product.price,
  }
  const availabilityObj = await getProductAvailability(AVAILABILITY_ENDPOINT, state.availabilityParams);
  updateProductAvailabilityDate(availabilityObj, state.availabilityParams);
}

const wishlistKingOnReady = () => {
  if(window.WishlistKing){
    window.WishlistKing.observe({
      selector: "#pdp-atw-wishlist-king"
    }, (target) => {
      target.append(window.WishlistKing.createComponent("wishlist-button", { id: window.product.id }) );
    });
  }
}

const learnMore = (container) => {
  const learnMoreLink = container.querySelector('.warranty-learn-more');
  learnMoreLink.addEventListener('click', learnMoreOnClick);
}

const displayWarranties = async (warrantiesSkus) => {
  if(!warrantiesSkus.includes('sku')) return;
  const parsedWarranties = JSON.parse('[' + warrantiesSkus.substring(0, warrantiesSkus.lastIndexOf(',')) + ']');
  if(parsedWarranties){
    const warrantiesSection = document.querySelector('.product__warranties');
    const warrantiesContainer = document.querySelector('.warranties-container');
    
    const warrantyObj = await Promise.all(parsedWarranties.map(async (warranty) => {
      const productResult = await getProductBySku(warranty[0].sku, null, window.LC.storefrontKey);
      return {
        warranty: productResult.results[0],
      };
    }));
    
    let warrantyPrice = 0;
    warrantyObj.forEach((warranty) => {
      warrantyPrice += +warranty.warranty.variants[0].price.amount;
    }); 
  
    const warrantyIds = warrantyObj.map((warranty) => {
      return warranty.warranty.variants[0].id;
    });
  
    const warrantyOption = `
      <div class="input-warranty" data-variant-id="${warrantyIds.join(',')}">
        <input id="warranty-input" type="checkbox" class="kf-input" >
        <label for="warranty-input" ><span class="warranty-title">${warrantyObj[0].warranty.title}:</span> <span class="warranty-price">$${warrantyPrice.toFixed(2)}</span> <a href="#" class="warranty-learn-more" data-warranty-name="${warrantyObj[0].warranty.title}">Learn more</a></label>
      </div>
    `;
  
    warrantiesContainer.innerHTML = warrantyOption;
    warrantiesSection.classList.remove('d-none');
    learnMore(warrantiesContainer);
  }
}

const resetWindowProperties = () => {
  window.product = null;
  window.productAvailability = null;
}

const carouselInit = () => {
  state.productImagesGlideInstance = new Glide('.product-media__carousel', PRODUCT_IMAGES_GLIDE_CAROUSEL_SETTINGS).mount();
  state.productImagesGlideInstance.update(PRODUCT_IMAGES_GLIDE_CAROUSEL_SETTINGS); 
  document.querySelector('.product-media__carousel').querySelector('.glide__prev').addEventListener('click', () => { state.productImagesGlideInstance.go('<'); });
  document.querySelector('.product-media__carousel').querySelector('.glide__next').addEventListener('click', () => { state.productImagesGlideInstance.go('>'); });
  showGlideArrows();
}

const showGlideArrows = () => {
  const pmCarouselThumbnails = document.querySelectorAll('.product-media__thumbnail');
  pmCarouselThumbnails.forEach((thumbnail) => {
    const thumbnailImageDataSrc = thumbnail.querySelector('img').dataset.src;
    thumbnail.querySelector('img').setAttribute('src', thumbnailImageDataSrc);
  });
  const pmCarouselPrev = document.querySelector('.glide__prev');
  const pmCarouselNext = document.querySelector('.glide__next');

  if (pmCarouselThumbnails.length > 1) {
    pmCarouselNext.classList.remove('hidden');
    pmCarouselPrev.classList.remove('hidden');
  }
}

const onColorOptionChange = (e) => {
  const selectedVariantId = e.target.closest('.product-color-option-wrapper').dataset.variantId;
  state.elements.quickViewContainer.querySelector('.product-form__submit').dataset.variantId = selectedVariantId;
}

export const showQuickView = (e) => {
  const button = e.target.closest('.quick-view__button');  
  if(button) {
    const productHandle = button.dataset.productHandle;
    const targetUrl = `${window.location.origin}/products/${productHandle}?section_id=main-product`;
    state.elements.quickViewContainer.classList.remove('hidden'); 
    state.elements.quickViewContainer.style.display = 'flex'; 
    state.elements.quickViewContainer.innerHTML = '';
    fetch(targetUrl)
    .then(response => response.text())
    .then(data => {
      state.elements.quickViewContainer.innerHTML = data;  
      document.body.classList.add('plp-overflow-hidden');
      const parser = new DOMParser();
      const htmlMarkup = parser.parseFromString(data, 'text/html')
      quickViewInit(htmlMarkup);
    })
  }
}

const quickViewInit = (htmlMarkup) => {
  carouselInit();
  const productJSON = JSON.parse(htmlMarkup.querySelector('script[type="application/json"][data-product-json]').innerHTML)
  const productAvailabilityJSON = JSON.parse(htmlMarkup.querySelector('script[type="application/json"][data-product-availability-format]').innerHTML);
  const warrantiesData = htmlMarkup.querySelector('script[type="application/json"][data-related-warranties]').innerHTML
  init();
  window.product = productJSON;
  window.productAvailability = productAvailabilityJSON;
  displayWarranties(warrantiesData);
  showQuickViewAvailability();
  wishlistKingOnReady();
  state.elements.quickViewContainer.querySelectorAll('.product-form__submit').forEach((button) => {button.addEventListener('click', quickViewFormSubmit);});
  state.elements.quickViewContainer.querySelectorAll('.product-color-option-wrapper').forEach((option) => {option.addEventListener('change', onColorOptionChange);});
  state.elements.closeQuickViewBtn.classList.remove('hidden');
  state.productImagesGlideInstance.update(PRODUCT_IMAGES_GLIDE_CAROUSEL_SETTINGS); 
}

const hideQuickView = (e) => {
  if(e.target.classList.contains('quick-view-container') || e.target.closest('.quick-view-close')) {
    state.elements.quickViewContainer.classList.add('hidden');
    document.body.classList.remove('plp-overflow-hidden');
    state.elements.closeQuickViewBtn.classList.add('hidden');
    resetWindowProperties();
  }
}

const quickViewFormSubmit = async (e) => {
  e.preventDefault();
  const selectedpreferenceValue = toggleZipPanelOnAddToCart();
  if(!selectedpreferenceValue) return;
  const inputWarranty = document.querySelector('.input-warranty');
  const inputWarrantyChecked = inputWarranty?.querySelector('input[type="checkbox"]').checked;
  const inputWarrantyVariantIds = inputWarranty?.dataset.variantId.split(',');
  const productVariantId = e.target.dataset.variantId;
  let items;
  const originalButtonText = e.target.textContent;
  e.target.textContent = "Adding...";
  if(inputWarrantyChecked){
    items = getProtectedPackToAddToCart(productVariantId, 1, window?.product?.packagedProducts.length != 0, inputWarrantyVariantIds);
  } else {
    items = [new AddToCartParam(productVariantId, 1)];
  }
  addToCart(items)
  .then((response) => {
      refreshMinicart();
      document.querySelector('#cart-icon-bubble').click();
      e.target.textContent = originalButtonText;
  })
}

const addEventListeners = () => {
  state.elements.quickViewContainer.addEventListener('click', hideQuickView);
  state.elements.closeQuickViewBtn.addEventListener('click', hideQuickView);
}

const initState = () => {
  cacheState();
  addEventListeners();
};

onDocumentReady(() => {
  initState();
});