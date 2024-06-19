 'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

import moment from 'moment';
import Glide from '@glidejs/glide';
import { addToCart } from './lib/cart';
import { stringToHtml, stringToPrice } from './utils/parsers';
import { showPopup, PopupConfigs } from './components/popup';
import generateResponsiveImg from './utils/generate-responsive-image';
import { getUserLocation } from './utils/user-location';
import { getRates, getRatesObjRequestModel } from './lib/shipping-rates';
import {
  getWarranties, getProtectedProducts, getGroupedWarranties, getWarrantiesExtraInformation,
  getCurrentProductsWarranties, getProtectedPackToAddToCart, learnMoreOnClick
} from './lib/warranties';
import { toggleZipPanelOnAddToCart } from './components/zip-panel';
import initZipPanel from './components/zip-panel';
import { onDocumentReady } from './utils/dom';
import { refreshMinicart } from './components/minicart';
import * as financingDetailsPopup from './components/financing-details-popup';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

var PACKAGED_PRODUCTS, PACKAGES;
const ADD_TO_CART_BTN_STATE_TEXT = {
  ADD: 'Add to cart',
  ADDING: 'Adding to cart . . .',
  ADDED: 'Added!'
},
PRODUCT_IMAGES_GLIDE_CAROUSEL_SETTINGS = {
  touchRatio: 1,
  perTouch: false,
  autoHeight: true
};
var WARRANTIES = [], PROTECTED_PRODUCTS = [], currentProtectedProducts = [], currentWarranties = [];
var addToCartWithoutWarranties = false, productImagesGlideInstance,
carouselFixedHeightInterval, windowResizeTimeout, availabilityDateElem;

/* --------------- DOM --------------- */

var $warrantiesSection, $warrantiesContainer, $btnAddToCart, $btnAddToCartMobileFooter, $relatedVariantsColorsContainer,
$productDescription, $productAttributes, $productMediaCarousel, $title, $packageDetailsTable;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

function checkSixtyMonthsOffer(){
  var productValue = parseFloat(document.querySelector('.price-item').dataset.value);
  if(productValue > window.sixtyMonthsOfferMinimumCartSubtotal){
    document.querySelectorAll('.financing-offer__info').forEach($info => $info.classList.remove('hidden'));
    document.querySelectorAll('.financing-offer__installments').forEach($installments => $installments.classList.remove('hidden'));
  }
}

function updatePackageTable(currentPackage){
  if(!PACKAGED_PRODUCTS || PACKAGED_PRODUCTS.length == 0){
    return;
  }
  
  let $tbody = $packageDetailsTable.querySelector('tbody'),
  $tfoot = $packageDetailsTable.querySelector('tfoot');
  
  $packageDetailsTable.querySelector('tbody').innerHTML = '';
  $packageDetailsTable.querySelector('tfoot').innerHTML = '';

  if(!currentPackage.packagedProducts || currentPackage.packagedProducts.length == 0){
    $packageDetailsTable.classList.add('hidden');
    return;
  } else {
    $packageDetailsTable.classList.remove('hidden');
  }
  
  currentPackage.packagedProducts.forEach((packagedProduct) => {
    let productName = packagedProduct.tags.find(tag => tag.toUpperCase() == 'NFS') ?
    `<span class="packaged-details__product-link">${packagedProduct.title}</span>` :
    `<a class="packaged-details__product-link" href="${packagedProduct.link}">${packagedProduct.title}</a>`,
    dimensions = `<span>${packagedProduct.dimensions}</span>`;
    
    $tbody.appendChild(stringToHtml(`
      <table>
        <tr data-sku="${packagedProduct.sku}">
          <td>${productName}${packagedProduct.dimensions ? dimensions : ''}</td>
          <td class="qty">${packagedProduct.qty}</td>
          <td>${packagedProduct.price}</td>
        </tr>
      </table>
    `).querySelector('tr'));
  });
  
  if(currentPackage.showSaveAmount){
    $tfoot.appendChild(stringToHtml(`
      <table>
        <tr>
          <td colspan="2" style="text-align:right !important;font-weight:bold;">Sold Separately:</td>
          <td>${stringToPrice(currentPackage.soldSeparately)}</td>
        </tr>
      </table>
    `).querySelector('tr'));
    
    $tfoot.appendChild(stringToHtml(`
      <table>
        <tr>
          <td colspan="2" style="text-align:right !important;font-weight:bold;">You Save:</td>
          <td style="color: red;">${stringToPrice(currentPackage.saveAmount)}</td>
        </tr>
      </table>
    `).querySelector('tr'));
  }

  $tfoot.appendChild(stringToHtml(`
    <table>
      <tr>
        <td colspan="2" style="text-align:right !important;font-weight:bold;">Total:</td>
        <td>${stringToPrice(currentPackage.total)}</td>
      </tr>
    </table>
  `).querySelector('tr'));
}

async function renderWarrantyOptions(){
  let $warrantyOption, groupedWarranties;
  
  groupedWarranties = getGroupedWarranties(getCurrentProductsWarranties(currentProtectedProducts));

  groupedWarranties.forEach((gw, i) => {
    const priceSum = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gw.priceSum);
    
    $warrantyOption = stringToHtml(`
    <div class="input-warranty" data-variant-id="${gw.warranties.map(w => `${w.variantId}:${w.currentProtectedProductSku}`).join(',')}">
      <input id="input-warranty-${i+1}" class="kf-input" type="checkbox" data-warranty-skus="${gw.warranties.map(w => w.sku)}">
      <label for="input-warranty-${i+1}"><span class="warranty-title">${gw.warranties[0].title}:</span> <span class="warranty-price">$${priceSum}</span> <a href="#" class="warranty-learn-more" data-warranty-name="${gw.warranties[0].title}">Learn more</a></label>
    </div>
    `);
    $warrantyOption.querySelector('.warranty-learn-more').addEventListener('click', learnMoreOnClick);
    $warrantiesContainer.append($warrantyOption);
  });

  $warrantiesSection.classList.remove('d-none');
}

function getCurrentVariantId(){
  if(document.querySelectorAll('[name="product-color-option"]').length > 0){
    return document.querySelector('[name="product-color-option"]:checked').value;
  } else {
    return window.product.variantId;
  }
}

function getProductsToAddToCart(){
  var $warrantiesSelectedInputs = document.querySelectorAll('.input-warranty input:checked'),
  addToCartParams = [], warrantyVariantIdsToAddToCart = [];

  $warrantiesSelectedInputs.forEach(($wsi) => {
    $wsi.closest('.input-warranty').dataset.variantId.split(',').forEach((relatedVarId) => {
      warrantyVariantIdsToAddToCart.push(relatedVarId.split(':')[0]);
    });
  });
  
  addToCartParams = getProtectedPackToAddToCart(getCurrentVariantId(), 1, PACKAGED_PRODUCTS.length != 0, warrantyVariantIdsToAddToCart);
  return addToCartParams;
}

/* --------------- Utils & Tools --------------- */

function atLeastOneWarrantySelected(){
  var $inputWarranties = $warrantiesContainer.querySelectorAll('.input-warranty input');

  for (let i = 0; i < $inputWarranties.length; i++) {
    if($inputWarranties[i].checked){
      return true;
    }
  }

  return false;
}

function selectAllWarranties(){
  $warrantiesContainer.querySelectorAll('.input-warranty input').forEach((wCheckbox) => {
    wCheckbox.checked = true;
  });
}

function updateAddToCartBtnStateText(stateText, revertTimeout = false){
  $btnAddToCart.innerText = stateText;
  $btnAddToCartMobileFooter.innerText = stateText;

  if(revertTimeout){
    setTimeout(() => {
      $btnAddToCart.innerText = ADD_TO_CART_BTN_STATE_TEXT.ADD;
      $btnAddToCartMobileFooter.innerText = ADD_TO_CART_BTN_STATE_TEXT.ADD;
    }, 2000);
  }
}

const showHideCarouselArrows = () => {
  const pmCarouselThumbnails = document.querySelectorAll('.product-media__thumbnail');
  const pmCarouselPrev = document.querySelector('.glide__prev');
  const pmCarouselNext = document.querySelector('.glide__next');

  if (pmCarouselThumbnails.length >= 2) {
    pmCarouselNext.classList.remove('hidden');
    pmCarouselPrev.classList.remove('hidden');
  }
};

function autoSelectWarranties(){
  let PROTECTED_TAG_KEY = 'Protected: ', $warrantyInputs = document.querySelectorAll('.product__warranties .input-warranty input');

  window.product?.tags?.forEach((tag) => {
    if(tag.startsWith(PROTECTED_TAG_KEY)){
      let warrantySku = tag.substring(PROTECTED_TAG_KEY.length);
      
      $warrantyInputs.forEach(($wi) => {
        if($wi.dataset.warrantySkus.includes(warrantySku)){
          $wi.checked = true;
        }
      });
    }
  });
}

function getSelectedPackageColor(){
  let packageVariantId = document.querySelector('[name="product-color-option"]')?.value || product.variantId;
  return window.LC?.packages?.find(p => p.variantId == packageVariantId);
}

async function getProductAvailability() {
  const productPrice = document.querySelector('.price__regular .price-item').dataset.price;
  const reqData = createRequestData(productPrice);
  await updateRequestData(reqData);
  const rateResponses = await getRates(reqData, false);
  displayProductAvailability(rateResponses);
}

function createRequestData(productPrice) {
  const reqData = getRatesObjRequestModel();
  const product = window.product;
  reqData.rate.items = [{
    id: product.id,
    quantity: 1,
    variant_id: product.variantId,
    price: productPrice,
    sku: product.sku
  }];
  return reqData;
}

async function updateRequestData(reqData) {
  reqData.rate.destination.province = (await getUserLocation()).region_code;
  let zipCode;
  const zipFromLocalStorage = localStorage.getItem('selected-delivery')
  if (zipFromLocalStorage) {
    zipCode = zipFromLocalStorage;
  } else {
    zipCode = document.getElementById("nearest-store-name").dataset.zipcode;
  }
  reqData.rate.destination.postal_code = zipCode
}

function displayProductAvailability(rateResponses) {
  const targetDeliveryMethodName = "WHITE GLOVE DELIVERY & SETUP SERVICE";
  const atpDate = rateResponses[0].atpDate;

  const today = new Date();
  const currentDate = today.toISOString().split("T")[0];

  if (atpDate === currentDate) {
    document.querySelector(".product-availability").classList.remove("hidden");
    if (localStorage.getItem('user-delivery-preference') === "pickup") return;
    availabilityDateElem.innerText = "Available Now!";
    return;
  }

  let targetRateGroup = rateResponses[0].rateGroups.find(rg => rg.serviceName.toUpperCase() == targetDeliveryMethodName);

  if(!targetRateGroup){
    return;
  }

  const availability = targetRateGroup.rates[0];

  if (availability) {
    document.querySelector(".product-availability").classList.remove("hidden");
    const availabilityDate = parseAvailabilityDate(availability.serviceCode);
    if (localStorage.getItem('user-delivery-preference') === "pickup") return;
    availabilityDateElem.innerText = `Pre Order. Available on ${moment(availabilityDate).format('MM/DD/YYYY')}!`;
  }
}

function parseAvailabilityDate(serviceCode) {
  const [_, day, month, year] = serviceCode.split('_');
  const availabilityYear = year.split('|')[0];
  const parsedDate = `${availabilityYear}-${month}-${day}`;
  return new Date(parsedDate);
}

////////// Events //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

async function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  PACKAGED_PRODUCTS = window.product.packagedProducts;
  $warrantiesSection = document.querySelector('.product__warranties');
  $warrantiesContainer = document.querySelector('.warranties-container');
  $btnAddToCart = document.querySelector('.product-form__submit');
  $btnAddToCartMobileFooter = document.querySelector('#mobile-footer-actions .product-form__submit');
  $relatedVariantsColorsContainer = document.querySelector('.related-product-colors');
  $productMediaCarousel = document.querySelector('.product-media__carousel');
  $productDescription = document.querySelector('.product__description-value');
  $productAttributes = document.querySelector('.product__attributes');
  $title = document.querySelector('.product__title > h1');
  $packageDetailsTable = document.querySelector('.package-details');
  availabilityDateElem = document.getElementById("product-availability-date");

  PACKAGES = window.LC?.packages;

  /* --------------- Events Setup --------------- */
  
  $btnAddToCart.addEventListener('click', onAddToCart);
  $btnAddToCartMobileFooter.addEventListener('click', onAddToCart);
  
  if($relatedVariantsColorsContainer){
    $relatedVariantsColorsContainer.querySelectorAll('input[name="product-color-option"]').forEach(($rpc) => {
      $rpc.addEventListener('change', productColorOptionChanged);
    });
  }
  
  showHideCarouselArrows();

  $productMediaCarousel.querySelector('.glide__prev').addEventListener('click', () => { productImagesGlideInstance.go('<'); });
  $productMediaCarousel.querySelector('.glide__next').addEventListener('click', () => { productImagesGlideInstance.go('>'); });

  document.querySelectorAll('.financing-details-popup-show').forEach(fpl => {
    fpl.addEventListener('click', (e) => {
      e.preventDefault();
      let price = document.querySelector('.product__info-wrapper .price__regular .price-item').innerText.replace('$', '').replace(',', '');
      financingDetailsPopup.showFinancingDetailsPopup(true, parseFloat(price));
    });
  });

  /* --------------- Initialization--------------- */

  onDocumentReady(() => {
    initZipPanel()
  })
  
  updatePackageTable(getSelectedPackageColor());

  productImagesGlideInstance = new Glide('.product-media__carousel', PRODUCT_IMAGES_GLIDE_CAROUSEL_SETTINGS).mount();
  
  checkSixtyMonthsOffer();

  WARRANTIES = await getWarranties();
  PROTECTED_PRODUCTS = getProtectedProducts(WARRANTIES);

  if(PACKAGED_PRODUCTS.length == 0){
    currentProtectedProducts.push(PROTECTED_PRODUCTS.find(pp => pp.sku == window.product.sku));
  } else {
    PACKAGED_PRODUCTS.forEach((packagedProduct) => {
      currentProtectedProducts.push(PROTECTED_PRODUCTS.find(pp => pp.sku == packagedProduct.sku));
    });
  }

  currentProtectedProducts = currentProtectedProducts.filter(cpp => cpp ? true : false);
  
  // Multiplies warranties per packagedProducts qty units
  if(PACKAGES?.length > 0){
    currentProtectedProducts.forEach((cpp) => {
      let packagedQty = getSelectedPackageColor()?.packagedProducts.find(pp => pp.sku == cpp.sku)?.qty;
      
      cpp.warranties.forEach(cppWarranty => {
        for (let i = 0; i < packagedQty-1; i++) {
          cpp.warranties.push(cppWarranty);
        }
      });
    });
  }

  currentWarranties = getCurrentProductsWarranties(currentProtectedProducts);
  getWarrantiesExtraInformation(currentWarranties, renderWarrantyOptions);
}

async function onAddToCart(e){
  e.preventDefault();
  const isDeliveryPreferenceSelected = toggleZipPanelOnAddToCart();
  if (!isDeliveryPreferenceSelected) return;
  if(currentProtectedProducts.length > 0 && !atLeastOneWarrantySelected() && !addToCartWithoutWarranties){
    var popupConfigs = new PopupConfigs('Are you sure you don’t want to protect your investment?', null, 'yes, protect it', 'continue without protection', () => {
      addToCartWithoutWarranties = true;
      selectAllWarranties();
      autoSelectWarranties();
      $btnAddToCart.click();
    }, () => {
      addToCartWithoutWarranties = true;
      $btnAddToCart.click();
    });

    showPopup(true, popupConfigs);
  } else {
    var productsToAddToCart = getProductsToAddToCart();
    
    updateAddToCartBtnStateText(ADD_TO_CART_BTN_STATE_TEXT.ADDING);

    await addToCart(productsToAddToCart);
    await refreshMinicart();

    updateAddToCartBtnStateText(ADD_TO_CART_BTN_STATE_TEXT.ADDED, true);

    document.querySelector('#cart-icon-bubble').click();
  }

  if(addToCartWithoutWarranties){
    addToCartWithoutWarranties = false;
  }
}

function productColorOptionChanged(e){
  var $colorInput = e.currentTarget,
  $productColorOptionWrapper = $colorInput.closest('.product-color-option-wrapper'),
  images = $productColorOptionWrapper.querySelector('input[name="related-product-images"]').value.split('~'),
  newSlide, newThumbnail,
  $glideSlides = $productMediaCarousel.querySelector('.glide__slides'),
  $glideThumbnails = $productMediaCarousel.querySelector('.glide__bullets'),
  $firstThumbnail = $productMediaCarousel.querySelector('.product-media__thumbnail'),
  thumbnailWidth = $firstThumbnail.clientWidth,
  thumbnailHeight = $firstThumbnail.clientHeight;

  $productMediaCarousel.classList.add('carousel-loading');

  if($colorInput.checked){
    if(carouselFixedHeightInterval){
      clearInterval(carouselFixedHeightInterval);
    }
    
    // Safari fix
    $productMediaCarousel.querySelector('.glide__slides').style.height = $productMediaCarousel.querySelector('.glide__slides').clientHeight + 'px';

    $glideSlides.innerHTML = '';
    $glideThumbnails.innerHTML = '';
  
    images.forEach((imgUrl, i) => {
      newSlide = generateResponsiveImg(imgUrl, [
        { imgWidth: 600, widthRes: 400 },
        { imgWidth: 1500, widthRes: 1000 },
        { imgWidth: 2100, widthRes: 1200 },
        { imgWidth: 990, widthRes: 1400 }
      ], 600, '', false, []);

      $glideSlides.appendChild(stringToHtml(`
        <li class="glide__slide">${newSlide}</li>
      `));

      $glideSlides.querySelectorAll('img').forEach(($img) => {
        let src = $img.getAttribute('src');
        $img.setAttribute('src', '')
        $img.setAttribute('src', src);
      });

      newThumbnail = generateResponsiveImg(imgUrl, [ { imgWidth: 100, widthRes: 200 }, ], 200, '', false, []);

      $glideThumbnails.appendChild(stringToHtml(`
        <div class="product-media__thumbnail glide__bullet" data-glide-dir="=${i}">${newThumbnail}</div>
      `));
    });
    
    productImagesGlideInstance.update(PRODUCT_IMAGES_GLIDE_CAROUSEL_SETTINGS);

    // Safari fix
    $productMediaCarousel.querySelectorAll('.product-media__thumbnail').forEach(($thumbnail) => {
      $thumbnail.style.width = thumbnailWidth + 'px';
      $thumbnail.style.height = thumbnailHeight + 'px';
      $thumbnail.querySelector('img').style.width = '100%';
    });

    $productDescription.innerHTML = $productColorOptionWrapper.querySelector('.product-color-description').cloneNode(true).innerHTML;
    $productAttributes.innerHTML = $productColorOptionWrapper.querySelector('.product-color-attributes').cloneNode(true).innerHTML;

    // Safari fix
    var $slideImg = $productMediaCarousel.querySelector('.glide__slides img:first-child');
    if($slideImg.complete){
      $productMediaCarousel.querySelector('.glide__slides').style.height = '';
    } else {
      $slideImg.addEventListener('load', () => {
        $productMediaCarousel.querySelector('.glide__slides').style.height = '';
      });
    }
    $productMediaCarousel.querySelectorAll('.product-media__thumbnail img').forEach(($thumbnailImg) => {
      if($thumbnailImg.complete){
        $thumbnailImg.parentElement.style.width = '';
        $thumbnailImg.parentElement.style.height = '';
      } else {
        $thumbnailImg.addEventListener('load', () => {
          $thumbnailImg.parentElement.style.width = '';
          $thumbnailImg.parentElement.style.height = '';
        });
      }
    });
  }

  showHideCarouselArrows();

  // LazyLoad update
  window.ll?.update();

  $title.innerText = $productColorOptionWrapper.querySelector('input[name="related-product-title"]').value;
  updatePackageTable(getSelectedPackageColor());
  window.history.pushState({}, {}, $productColorOptionWrapper.querySelector('input[name="related-product-url"]').value);
  
  $productMediaCarousel.classList.remove('carousel-loading');
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
