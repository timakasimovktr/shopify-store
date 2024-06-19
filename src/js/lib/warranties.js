'use strict';

////////// Dependencies /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

import { getProductBySku } from './../utils/product-query';
import { generateRandomId } from './../utils/generate-random-id';
import { AddToCartParam } from './cart';
import { showPopup, PopupConfigs, PopupStyles } from './../components/popup';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

const LIMITED_SKUS = [{ startingSku: '098', limit: 199.99 }];
var WARRANTIES = [];

/* --------------- DOM --------------- */

var $warrantyModalFabric, $warrantyModalLeather, $warrantyModalPower;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

/**
 * Returns the ID of PDP product or
 * all de ids of packaged products in
 * an array
 */
function getProductIds(){
  let productIds = [];

  if(window.location.href.includes('/cart')){
    window.LC?.cartItems?.forEach((ci) => {
      if(ci.packagedProducts.length > 0){
        ci.packagedProducts.forEach((pp) => {
          productIds.push(pp.id);
        });
      } else {
        productIds.push(ci.id);
      }
    });
  } else if(window.product?.packagedProducts?.length == 0){
    productIds.push(window.product.id);
  } else {
    productIds = window.product.packagedProducts.map(pp => pp.id);
  }
  
  return productIds;
}

function getWarranties(){
  window.LC?.relatedWarranties?.forEach((relatedWarranty) => {
    let warranty, warrantyTargetIndex = WARRANTIES.findIndex(w => w.sku == relatedWarranty.sku);
    if(warrantyTargetIndex == -1){
      warranty = new Warranty(relatedWarranty.sku.toString(), relatedWarranty.type, null, null, null, null, [relatedWarranty.coveredProductSku]);
      WARRANTIES.push(warranty);
      warrantyTargetIndex = WARRANTIES.length -1;
    } else {
      WARRANTIES[warrantyTargetIndex].protectedProductSkus.push(relatedWarranty.coveredProductSku);
    }
    warranty = WARRANTIES[warrantyTargetIndex];
  });

  return WARRANTIES;
}

/**
 * This function will create a list of ProtectedProduct[]
 * 
 * @param {Warranty} warranties 
 * @returns ProtectedProduct[]
 */
function getProtectedProducts(warranties){
  var protectedProducts = [], protectedProduct;

  warranties.forEach((warranty) => {
    warranty.protectedProductSkus.forEach((ppSku) => {
      protectedProduct = protectedProducts.find(pp => pp.sku == ppSku);

      if(protectedProduct && !protectedProduct.warranties.find(w => w.sku == warranty.sku)){
        protectedProduct.warranties.push(warranty);
      } else {
        protectedProducts.push(new ProtectedProduct(ppSku, [warranty])); 
      }
    });
  });
  
  return protectedProducts;
}

function getCurrentProductsWarranties(currentProtectedProducts){
  var currentProtectedProductsWarranties = [];
  currentProtectedProducts = currentProtectedProducts.filter(cpp => cpp ? true : false);
  currentProtectedProducts.forEach(cpp => {
    cpp.warranties.forEach(w => {
      w.currentProtectedProductSku = cpp.sku;
      if(!w.error){
        currentProtectedProductsWarranties.push(w);
      }
    });
  });
  
  return currentProtectedProductsWarranties;
}

/**
 * Gets and caches extra info of current
 * product warranties. Will execute
 * parallel server calls until all warranties
 * were fetched and response is returned.
 * 
 * @param {*} warranties 
 */
 function getWarrantiesExtraInformation(currentProductWarranties, allWarrantiesLoadedCallback){
  var filteredCurrentProductWarranties = [];

  // Remove duplicated warranties
  currentProductWarranties.forEach((cpp) => {
    if(!filteredCurrentProductWarranties.find(fcpp => fcpp.sku == cpp.sku)){
      filteredCurrentProductWarranties.push(cpp);
    }
  });
  
  for (let i = 0; i < filteredCurrentProductWarranties.length; i++) {
    var targetWarrantyIndex = WARRANTIES.findIndex(allWarranty => allWarranty.sku == filteredCurrentProductWarranties[i].sku);

    if(filteredCurrentProductWarranties[i].caching || filteredCurrentProductWarranties[i].cached){
      return;
    } else {
      WARRANTIES[targetWarrantyIndex].caching = true;
    }

    const storefrontKey = window.LC.storefrontKey;
    
    getProductBySku(filteredCurrentProductWarranties[i].sku, i, storefrontKey).then((res) => {
      
      let targetWarrantyIndex = WARRANTIES.findIndex(allWarranty => allWarranty.sku == filteredCurrentProductWarranties[res.reqId].sku);

      WARRANTIES[targetWarrantyIndex].cached = true;

      if(res.results && res.results.length > 0){
        var resWarranty = res.results[0];

        WARRANTIES[targetWarrantyIndex].title = resWarranty.title;
        WARRANTIES[targetWarrantyIndex].variantId = resWarranty.variants[0].id;
        WARRANTIES[targetWarrantyIndex].price = resWarranty.variants[0].price.amount;
      } else {
        console.warn(`Error getting warranty ${filteredCurrentProductWarranties[res.reqId].sku} information`);
        WARRANTIES[targetWarrantyIndex].error = true;
      }

      // Check all warranties from product were fetched
      if(WARRANTIES.filter(w => w.caching).length == WARRANTIES.filter(w => w.cached).length){
        allWarrantiesLoadedCallback();
      }
    });
  }
}

/**
 * Returns a limitted sum
 * @param {*} sum 
 * @param {*} plusPrice 
 * @param {*} startingSku 
 * @returns 
 */
 function performLimittedSum (sum, plusPrice, startingSku){
	var limitObj = LIMITED_SKUS.find((limitObj) => { return limitObj.startingSku == startingSku; });

  sum = parseFloat(sum);
  plusPrice = parseFloat(plusPrice);
  
	if(limitObj){
		if(sum + plusPrice <= limitObj.limit){
			sum += plusPrice;
		} else {
			sum = limitObj.limit;
		}
	} else {
		sum += plusPrice;
	}

	return sum.toFixed(2);
}

function getWarrantyStartingSku(sku) {
	if(sku.startsWith('39')){
		return sku.substring(0, 2);
	} else if(sku.startsWith('098') || sku.startsWith('099')){
		return sku.substring(0, 3);
	}
}

function getGroupedWarranties(warranties) {
  var groupedWarranties = [];

	warranties.forEach((warranty) => {
		var targetStartingSku = getWarrantyStartingSku(warranty.sku),
		targetIndex = groupedWarranties.findIndex(gw => gw.startingSku == targetStartingSku);
    
		if(groupedWarranties.find(gp => gp.startingSku == targetStartingSku)){
      groupedWarranties[targetIndex].priceSum = performLimittedSum(groupedWarranties[targetIndex].priceSum, warranty.price, targetStartingSku);
			groupedWarranties[targetIndex].warranties.push(warranty);
		} else {
			groupedWarranties.push(new GroupedWarranties([warranty], warranty.price));
		}
	});
  
	return groupedWarranties;
}

/* --------------- Utils & Tools --------------- */

/**
 * Returns the properties object for a new
 * protected product that will have new
 * related warranties in the cart
 * 
 * @param {boolean} isPackage 
 */
 function getProtectedProductNewProperties(isPackage, warrantyUniqueId = null){
  return new ProtectedProductProperties(generateRandomId(), !isPackage ? generateRandomId() : warrantyUniqueId);
}

/**
 * Returns the main product and associated
 * warranties as AddToCartParams
 * 
 * @param {*} protectedProductItem 
 * @param {*} warranties 
 * 
 * @return AddToCartParam[]
 */
function getProtectedPackToAddToCart(protectedProductVariantId, protectedProductQty, protectedProductIsPackage, associatedWarrantyVariantIds){
  var addToCartParams = [], protectedProductProperties = {}, warrantyProperties,
  warrantyUniqueId = protectedProductIsPackage ? generateRandomId() : false;
  
  if(associatedWarrantyVariantIds.length > 0){
    protectedProductProperties = getProtectedProductNewProperties(protectedProductIsPackage, warrantyUniqueId ? warrantyUniqueId : null);

    if(window.product?.tags?.map(tag => tag.toLowerCase()).includes('freeshipping')){
      protectedProductProperties['freeShipping'] = true;
    }
  }

  if(protectedProductIsPackage){
    protectedProductProperties.isPackage = true;
  }

  // First product is PDP product
  addToCartParams.push(new AddToCartParam(protectedProductVariantId, protectedProductQty, protectedProductProperties));
  
  associatedWarrantyVariantIds.forEach((assocWarrantyId) => {
    if(!protectedProductIsPackage){
      warrantyProperties = new WarrantyProperties(addToCartParams[0].properties.productUniqueId, generateRandomId());
      delete warrantyProperties.warrantySetId;
      
      if(!addToCartParams[0].properties.warrantyId){
        // Only one warranty. properties.warrantyId points to the warranty.
        addToCartParams[0].properties.warrantyId = assocWarrantyId;
      } else {
        // More than one warranty. properties.warrantyId should be empty
        addToCartParams[0].properties.warrantyId;
      }
    
      addToCartParams.push(new AddToCartParam(assocWarrantyId, protectedProductQty, warrantyProperties));
    } else {
      warrantyProperties = new WarrantyProperties(addToCartParams[0].properties.productUniqueId, warrantyUniqueId, generateRandomId());
      addToCartParams.push(new AddToCartParam(assocWarrantyId, protectedProductQty, warrantyProperties));
    }
  });

  return addToCartParams;
}

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  $warrantyModalFabric = document.querySelector('#modal-warranty-fabric-protection');
  $warrantyModalLeather = document.querySelector('#modal-warranty-leather-protection');
  $warrantyModalPower = document.querySelector('#modal-warranty-power-protection');
  
  /* --------------- Events Setup --------------- */

  /* --------------- Initialization--------------- */
  
  
  /* --------------- Window Export --------------- */
}

function learnMoreOnClick(e){
  e.preventDefault();
  var warrantyTitle = e.currentTarget.dataset.warrantyName.toLowerCase(), targetWarrantyModalContent;

  if(warrantyTitle.includes('fabric')){
    targetWarrantyModalContent = $warrantyModalFabric.innerHTML;
  } else if(warrantyTitle.includes('leather')){
    targetWarrantyModalContent = $warrantyModalLeather.innerHTML;
  } else if(warrantyTitle.includes('power')){
    targetWarrantyModalContent = $warrantyModalPower.innerHTML;
  }


  var popupStyles = new PopupStyles('0', '0', true, false, false),
  popupConfigs = new PopupConfigs(false, targetWarrantyModalContent);
  
  showPopup(true, popupConfigs, popupStyles);
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

class ProtectedProduct {
  sku;
  warranties;

  constructor(sku, warranties){
    this.sku = sku;
    this.warranties = warranties;
  }
}

class Warranty {
  sku;
  type;
  startingSku;
  title;
  variantId;
  currentProtectedProductSku;
  protectedProductSkus;
  cached;
  error;

  /**
   * Cached defines if the extra info of the warranty
   * was gotten from Shopify or not (prevents multiple server calls).
   * 
   * @param {*} sku 
   * @param {*} type 
   * @param {*} startingSku 
   * @param {*} title 
   * @param {*} variantId
   * @param {*} currentProtectedProductSku
   * @param {*} protectedProductSkus
   * @param {*} caching
   * @param {*} cached
   * @param {*} error - true if couldn't get extra info traying to cache it
   */
  constructor(sku, type, startingSku = '', title = '', variantId = null, currentProtectedProductSku = '', protectedProductSkus = '', cached = false, caching = false, error = false){
    this.sku = sku;
    this.type = type;
    this.startingSku = getWarrantyStartingSku(sku);
    this.startingSku = startingSku;
    this.title = title;
    this.variantId = variantId;
    this.currentProtectedProductSku = currentProtectedProductSku;
    this.protectedProductSkus = protectedProductSkus;
    this.caching = caching;
    this.cached = cached;
    this.error = error;
  }
}

class GroupedWarranties {
  priceSum;
  warranties;
  startingSku;

  constructor(warranties, priceSum) {
    this.priceSum = priceSum;
		this.warranties = warranties;
    this.startingSku = getWarrantyStartingSku(warranties[0].sku);
  }
}

class ProtectedProductProperties {
  productUniqueId;
  warrantyRelatedUniqueId;
  warrantyId;

  constructor(productUniqueId, warrantyRelatedUniqueId, warrantyId){
    this.productUniqueId = productUniqueId;
    this.warrantyRelatedUniqueId = warrantyRelatedUniqueId;
    this.warrantyId = warrantyId;
  }
}

class WarrantyProperties {
  appliedToProductUniqueId;
  warrantyUniqueId;
  warrantySetId;

  constructor(appliedToProductUniqueId, warrantyUniqueId, warrantySetId = ''){
    this.appliedToProductUniqueId = appliedToProductUniqueId;
    this.warrantyUniqueId = warrantyUniqueId;
    this.warrantySetId = warrantySetId;
  }
}

////////// Exports //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export {
  ProtectedProduct,
  Warranty,
  GroupedWarranties,
  ProtectedProductProperties,
  WarrantyProperties,
  
  getProtectedPackToAddToCart,
  getGroupedWarranties,
  getCurrentProductsWarranties,
  getWarrantiesExtraInformation,
  getWarranties,
  getProtectedProducts,
  performLimittedSum,
  getWarrantyStartingSku,

  learnMoreOnClick
};