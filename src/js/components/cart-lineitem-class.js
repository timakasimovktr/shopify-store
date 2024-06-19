import { fetchCartData, rerenderLineItems } from "../cart";
import { debounce } from "../utils/performance";
import { generateRandomId } from "../utils/generate-random-id";
import { getCart, addToCart } from "../lib/cart";
import { learnMoreOnClick } from '../lib/warranties';
import { initAccordion } from "./accordion";

export default class LineItem {
  constructor(lineItemEl) {
    this.state = {
      lineItem: {},
      elements: {
        warranty: {},
        qtyControl: {},
      },
    };

    lineItemEl.classList.add('initialized');
    this.cacheState(lineItemEl);
    this.addEventListeners();
    this.debounceUpdateQuantity = debounce(this.updateQuantity.bind(this), 500)
  }

  // GETTERS & SETTERS

  get lineItem() {
    return this.state.lineItem
  }
  get warrantyEls() {
    return this.state.elements.warranty
  }
  get qtyEls() {
    return this.state.elements.qtyControl
  }
  get el() {
    return this.state.elements
  }
  set setLineItemQty(newQty) { 
    if (isNaN(newQty)) return;
    let qty = +newQty > 0 ? +newQty : 0;
    this.lineItem.qty = qty;
    this.qtyEls.input.value = qty;
    this.qtyEls.warrantyQty.innerHTML = `Qty: ${qty}`;
  }

  cacheState(lineItemEl) {
    this.state.lineItem = {
      ...this.state.lineItem,
      el: lineItemEl,
      key: lineItemEl.dataset.key,
      qty: +lineItemEl.dataset.quantity,
      variantId: lineItemEl.dataset.variantId,
      productUniqueId: lineItemEl.dataset.productUniqueId,
      itemWarrantyIds: lineItemEl
        .querySelector('.warranty-input-container__input')
        .dataset.warrantyIds
        .split(",").filter(Boolean),
      isWarrantyApplied: lineItemEl
        .querySelector('.warranty-input-container__input')
        .checked,
    }
    this.state.elements = {
      ...this.state.elements,
      warranty: {
        ...this.state.elements.warranty,
        warrantyInputs: lineItemEl.querySelector('.warranty-input-container__input'),
        checkBox: lineItemEl.querySelector(".warranty-input-container__input"),
        warrantyLearnMoreLinks: lineItemEl.querySelector('.warranty-input-container__learn-more'),
        warrantyLoader: lineItemEl.querySelector('.warranty-loader'),
        infoQtyInput: lineItemEl.querySelector(".info-qty-input"),
        infoQty: lineItemEl.querySelector(".info-qty"),
        cartItemInfoQty: lineItemEl.querySelector(".cart-item__info-qty"),
        warrantyAccordion: lineItemEl.querySelector('.accordion')
      },
      qtyControl: {
        ...this.state.elements.qtyControl,
        input: lineItemEl.querySelector('.cart-item__info-qty-input'),
        plusBtn: lineItemEl.querySelector('.cart-item__info-qty-plus-input'),
        minusBtn: lineItemEl.querySelector('.cart-item__info-qty-minus-input'),
        removeBtn: lineItemEl.querySelector('.cart-item__info-remove'),
        warrantyQty: lineItemEl.querySelector('.info-qty span'),
        loader: lineItemEl.querySelector('.qty-loader'),
      },
      lineItemsContainer: document.querySelector('#cart-page .cart-items'),
      originalPrice: lineItemEl.querySelector('.cart-item__info-original-price'),
      finalPrice: lineItemEl.querySelector('.cart-item__info-price'),
      discount: lineItemEl.querySelector('.cart-item__info-save-text'),
      priceContainer: lineItemEl.querySelector('.cart-item__info-prices'),
      saveForLater: lineItemEl.querySelectorAll('.atw-msg'),
    }
  }

  addEventListeners() {
    this.addQtyControlEventListeners();
    this.addWarrantyEventListeners();
    this.el.saveForLater.forEach(
      saveEl => {
        saveEl.addEventListener('click', this.handleWishlistClick.bind(this))
      })
  }

  // QTY CONTROL METHODS
  
  addQtyControlEventListeners() {
    this.qtyEls.plusBtn.addEventListener('click', this.handleQtyChange.bind(this, (qty) => qty + 1));
    this.qtyEls.minusBtn.addEventListener('click', this.handleQtyChange.bind(this, (qty) => qty - 1));
    this.qtyEls.removeBtn.addEventListener('click', this.handleQtyChange.bind(this, () => 0));
    this.qtyEls.input.addEventListener('change', (e) => this.handleQtyChange(() => +e.target.value));
  }

  async handleQtyChange(updateFn) {
    if (window.Cart.isLoading) return;
    this.qtyEls.loader.classList.remove('hidden');
    this.setLineItemQty = updateFn(this.lineItem.qty)
    this.debounceUpdateQuantity();
  }

  async updateQuantity() {
    const body = {
      id: this.lineItem.key,
      quantity: +this.lineItem.qty,
    }
    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
  
      const data = await response.json();
      rerenderLineItems();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // WARRANTY METHODS

  addWarrantyEventListeners() {
    this.warrantyEls.checkBox.addEventListener('change', this.handleWarrantyChange.bind(this));
    this.warrantyEls.warrantyLearnMoreLinks.addEventListener('click', learnMoreOnClick);
    initAccordion(this.warrantyEls.warrantyAccordion)
  }

  async removeWarrantiesFromCart(cartItems){
    const warrantiesToRemove = cartItems.filter(
      (item) => item.properties?.appliedToProductUniqueId === this.lineItem.productUniqueId
    ).reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: 0,
      }),
      {}
    );

    await fetchCartData("/cart/update.js", warrantiesToRemove);
  }

  async updateCartItemProp(cartItems){
    const cartItem = cartItems.find((item) => item.key == this.lineItem.key);

    if (!cartItem) {
      console.error("Cart item not found.");
      return;
    }

    const { 
      productUniqueId:prevProductUniqId, 
      warrantyRelatedUniqueId:prevWarrantyRelatedUniqId, 
      ...currentProperties 
    } = cartItem.properties;

    let updateProperties = {
      id: this.lineItem.key,
      quantity: +this.lineItem.qty,
      properties: {
        ...(currentProperties || []),
        ...(
          this.lineItem.productUniqueId && 
          { productUniqueId: this.lineItem.productUniqueId }
        ),
        ...(
          this.lineItem.warrantyUniqueId && 
          { warrantyRelatedUniqueId: this.lineItem.warrantyUniqueId }
        ),
      },
    }

    try {
      const response = await fetchCartData("/cart/change.js", updateProperties);
      return response;
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  getLineItemWarranties () {
    const lineItems = this.lineItem.itemWarrantyIds
      .filter((idStr) => { 
        const [variantId, quantity] = idStr.split(":");
        return Boolean(variantId && quantity);
      }).map((id, index) => {
        const [variantId, quantity] = id.split(":");
        
        return {
          id: +variantId,
          quantity: +quantity * +this.lineItem.qty,
          properties: {
            warrantyUniqueId: this.lineItem.warrantyUniqueId,
            appliedToProductUniqueId: this.lineItem.productUniqueId,
            index,
          },
        };
      });

    return lineItems
  }

  async addWarrantiesToCart(){
    const lineItems = this.getLineItemWarranties();
    try {
      await addToCart(lineItems);
    } catch (error) {
      console.error("Error: ", error.message);
    }
  }

  async getCartItems() {
    const cart = await getCart();
    return cart.items;
  }

  toggleWarrantyLoader(showLoader = false) {
    this.warrantyEls.checkBox[`${
      showLoader ? 
      "setAttribute" : 
      "removeAttribute"
    }`]('disabled', true);
    this.warrantyEls.warrantyLoader.classList[`${
      showLoader ?
      "remove" : 
      "add"
    }`]('hidden');
  }

  async handleRemoveWarranty(cartItems) {
    this.lineItem.productUniqueId = null;
    this.lineItem.warrantyUniqueId = null;
    await this.updateCartItemProp(cartItems);
    await this.removeWarrantiesFromCart(cartItems);
  }

  async handleApplyWarranty(cartItems) {
    this.lineItem.productUniqueId = generateRandomId();
    this.lineItem.warrantyUniqueId = generateRandomId();
    await this.updateCartItemProp(cartItems);
    await this.addWarrantiesToCart();
  }

  async handleWarrantyChange(e) {
    if (window.Cart.isLoading) {
      e.preventDefault();
      return;
    }
    this.toggleWarrantyLoader(true);
    const cartItems = await this.getCartItems();

    if(this.lineItem.isWarrantyApplied) {
      await this.handleRemoveWarranty(cartItems);
    } else {
      await this.handleApplyWarranty(cartItems);
    }
    rerenderLineItems();
  }

  // OTHER METHODS

  handleWishlistClick(e) {
    e.preventDefault();
    this.el.wishlishBtn = this.lineItem.el.querySelector('.wk-button');
    this.el.wishlishBtn.click();
  }
}
