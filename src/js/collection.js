'use strict';
import { onDocumentReady } from "./utils/dom";
import { addToCart, AddToCartParam } from './lib/cart';
import { refreshMinicart } from './components/minicart';
import { showQuickView } from './components/quick-view'; 

const state = {
  currentPage: 1,
  hasNextPage: true,
  intersectionObserverOptions: {
    root: null,
    rootMargin: '0px 0px 500px 0px',
    threshold: 0,
  },
  intersectionObserver: null,
  parser: new DOMParser(),
  activeFilters: new URLSearchParams(window.location.search),
  loading: false,
};

const cacheState = () => {
  state.elements = {
    ...state.elements,
    productGrid: document.getElementById('product-grid'),
    cardInformations: document.querySelectorAll('.card__information'),
    target: document.querySelector('.footer__content-bottom'),
    spinnerLoading: document.querySelector('.spinner-loading'),
    addToCartButtons: document.querySelectorAll('.add-to-cart'),
    filterBtns: document.querySelectorAll('.ss-actions .ss-actions__filters'),
    sortBtns: document.querySelectorAll('.ss-actions .ss-actions__sort'),
    filtersOffcanvas: document.getElementById('filters-offcanvas'),
    filterAccordionItems: document.querySelectorAll('#filters-offcanvas .accordion_item'),
    sortItems: document.querySelectorAll('#sort-offcanvas .offcanvas__content li'),
    sortLabels: document.querySelectorAll('#sort-offcanvas .offcanvas__content li label'),
    sortOffcanvas: document.getElementById('sort-offcanvas'),
    applyFiltersBtn: document.querySelector('.filter-offcanvas__apply-btn'),
    applySortBtn: document.querySelector('.sort-offcanvas__apply-btn'),
    close_btn: document.querySelectorAll('.offcanvas__header .kf-icon__close'),
    clearAllBtn: document.querySelector('.offcanvas__clear-btn'),
    filtersPanel: document.querySelector('.filters-panel'),
    filterInputs: document.querySelectorAll('.offcanvas__content .accordion_item input'),
    collectionEmpty: document.querySelector('.collection--empty'),
  };
};  

const getFetchUrl = () => {
  const currentUrl = new URL(window.location.href);
  const searchParams = new URLSearchParams(currentUrl.search);
  searchParams.set('page', state.currentPage + 1);
  searchParams.set('section_id', window.LC.sectionId);
  return `${currentUrl.origin}${currentUrl.pathname}?${searchParams.toString()}`
};

const loadMoreProducts = async () => {
  state.loading = true;
  if (!state.hasNextPage) return;
  state.elements.spinnerLoading.classList.remove('hidden');
  try {
    const targetUrl = getFetchUrl();
    const response = await fetch(targetUrl);
    const htmlMarkup = state.parser.parseFromString(await response.text(), 'text/html');
    const products = htmlMarkup.querySelectorAll('.product.grid__item');
    state.hasNextPage = htmlMarkup.getElementById('product-grid').dataset.hasNextPage;
 
    products.forEach(product => {
      state.elements.productGrid.appendChild(product.cloneNode(true));
    });

    state.currentPage++;
  } catch (error) {
    console.error('Error fetching more products', error);
  } finally {
    state.elements.spinnerLoading.classList.add('hidden');
    state.loading = false;
  }
};

const disableAddToCartBtn = () => {
  state.elements.cardInformations.forEach((cardInformation) => {
    const relatedProductColors = cardInformation.querySelector('.related-product-colors');
    const addToCartButton = cardInformation.querySelector('.add-to-cart');
    if (relatedProductColors && addToCartButton && !addToCartButton.dataset.colorChosen) {
      addToCartButton.classList.add('disabled');
      addToCartButton.disabled = true;
    }
  });
}

const onColorSelect = (e) => {
  const productColorOption = e.target.closest('.related-product-color');
  const productColorOptionWrapper = productColorOption.closest('.product-color-option-wrapper');
  if(!productColorOptionWrapper) return;
  const variantId = productColorOptionWrapper.dataset.variantId;
  const cardInformation = productColorOptionWrapper.closest('.card__information');
  if (!cardInformation) return;
  const addToCartButton = cardInformation.querySelector('.add-to-cart');
  if (addToCartButton && window.LC?.quickBuy) {
    addToCartButton.classList.remove('disabled');
    addToCartButton.disabled = false;
    addToCartButton.dataset.variantId = variantId;
    addToCartButton.dataset.colorChosen = 'true';
  }

  const productColorOptions = cardInformation.querySelectorAll('.product-color-option-wrapper');
  productColorOptions.forEach((el) => {
    el.classList.remove('active');
  });
  productColorOptionWrapper.classList.add('active');
}

const onIntersection = (entries, observer) => {
  entries.forEach(entry => {
    if ((entry.isIntersecting && state.elements.productGrid.dataset.resultMode == 'infinite') && !state.loading) {
      loadMoreProducts();
    }
  });
};

const onAddToCartBtn = async (e) => {
  const button = e.target.closest('.add-to-cart');
  if (!button) return;
  const originalButtonText = button.textContent;
  button.textContent = "Adding...";
  const variantId = button.getAttribute("data-variant-id");
  const quantity = button.getAttribute("data-quantity") || 1;
  const freeShipping = button.getAttribute("data-free-shipping") === "true";
  const items = [new AddToCartParam(variantId, Number(quantity), (freeShipping ? { freeShipping: true } : {}))];
  addToCart(items)
  .then((response) => {
      refreshMinicart();
      document.querySelector('#cart-icon-bubble').click();
      button.textContent = originalButtonText;
  })
  .catch((error) => {
      console.error("Error adding to cart", error);
      button.textContent = originalButtonText;
  });
}

const actionFiltersOnClick = (type) => {
  if(type === 'filterBtn') {
    state.elements.filtersOffcanvas.classList.toggle('shown');
    state.elements.sortOffcanvas.classList.remove('shown');
    toggleFiltersPanel(state.elements.filtersOffcanvas);
  } else {
    state.elements.sortOffcanvas.classList.toggle('shown');
    state.elements.filtersOffcanvas.classList.remove('shown');
    toggleFiltersPanel(state.elements.sortOffcanvas);
  }
}

const toggleFiltersPanel = (element) => {
  if(element.classList.contains('shown')) {
    document.body.classList.add('plp-overflow-hidden');
    state.elements.filtersPanel.classList.remove('hidden');
  } else {
    document.body.classList.remove('plp-overflow-hidden');
    state.elements.filtersPanel.classList.add('hidden');
  }
}

const closeFiltersPanel = (e) => {
  state.elements.filtersOffcanvas.classList.remove('shown');
  state.elements.sortOffcanvas.classList.remove('shown');
  state.elements.filtersPanel.classList.add('hidden');
  document.body.classList.remove('plp-overflow-hidden');
}

const updateNewFilters = (e, isSortOption) => {
  const { activeFilters } = state;
  const filterKey = e.target.dataset.paramName;
  let filterValue = e.target.value || e.target.dataset.value;
  const appliedFilterValues = activeFilters.getAll(filterKey);
  const isPriceRange = e.target.dataset.priceRange;
  let currentLabel = e.target.parentElement.querySelector('label');
  if(isSortOption && currentLabel) {
    currentLabel.classList.add('sort-active');
    if(!currentLabel.textContent.includes(': desc') && !currentLabel.textContent.includes(': asc') && !currentLabel.dataset.unique) {
      currentLabel.textContent = currentLabel.textContent + ': desc';
      filterValue = currentLabel.dataset.descValue;
    } else {
      if(currentLabel.textContent.includes(': desc')) {
        currentLabel.textContent = currentLabel.textContent.replace(': desc', ': asc');
        filterValue = currentLabel.dataset.ascValue;
      } else if (currentLabel.textContent.includes(': asc')) {
        currentLabel.textContent = currentLabel.textContent.replace(': asc', ': desc');
        filterValue = currentLabel.dataset.descValue;
      }
    }
    state.elements.sortLabels.forEach(label => {
      if(label !== currentLabel) {
        label.classList.remove('sort-active');
        label.textContent = label.textContent.replace(': desc', '');
        label.textContent = label.textContent.replace(': asc', '');
      }
    });
  }
  if(!isPriceRange){
    if(isSortOption && appliedFilterValues.length > 0){
      activeFilters.delete(filterKey);
    } 
    if(appliedFilterValues.includes(filterValue)){
      activeFilters.delete(filterKey);
      appliedFilterValues.forEach(value => {
        if(value !== filterValue) {
          activeFilters.append(filterKey, value);
        }
      });
    } else {
      activeFilters.append(filterKey, filterValue);
    }
  } else {
    if(!appliedFilterValues.includes(filterKey)){
      activeFilters.delete(filterKey);
      activeFilters.append(filterKey, filterValue);
    }
  }
}

const applyFilters = async (clearAll) => {
  if(clearAll){
    state.activeFilters = new URLSearchParams();
    const sortParam = new URLSearchParams(window.location.search).get('sort_by');
    const searchParam = new URLSearchParams(window.location.search).get('q');
    if(sortParam) {
      state.activeFilters.append('sort_by', sortParam);
    }
    if (searchParam) {
      state.activeFilters.append('q', searchParam);
    }
    state.elements.filterInputs.forEach(input => {input.checked = false;});
  }
  const newUrl = `${window.location.origin}${window.location.pathname}${state.activeFilters.size > 0 ? '?' + state.activeFilters.toString() : ''}`;
  window.history.replaceState(null, null, newUrl);
  state.currentPage = 1;
  state.loading = true;
  state.elements.productGrid.innerHTML = '';
  closeFiltersPanel();
  try {
    let targetUrl;
    let sectionIdUrl = `${window.location.origin}${window.location.pathname}?page=${state.currentPage}&section_id=${window.LC.sectionId}`;
    targetUrl = `${sectionIdUrl}&${state.activeFilters.toString()}`;
    const response = await fetch(targetUrl);
    const htmlMarkup = state.parser.parseFromString(await response.text(), 'text/html');
    const products = htmlMarkup.querySelectorAll('.product.grid__item');
    state.hasNextPage = htmlMarkup.getElementById('product-grid').dataset.hasNextPage;

    products.forEach(product => {
      state.elements.productGrid.appendChild(product.cloneNode(true));
    });

    if(products.length > 0){
      state.elements.collectionEmpty.classList.add('hidden');
    } else {
      state.elements.collectionEmpty.classList.remove('hidden');
    }

    state.currentPage++;
    state.loading = false;
  } catch (error) {
    console.error('Error fetching more products', error);
  }
}

const addEventListeners = () => {
  state.intersectionObserver = new IntersectionObserver(onIntersection, state.intersectionObserverOptions);
  state.intersectionObserver.observe(state.elements.target);
  state.elements.productGrid.addEventListener('click', onAddToCartBtn);
  state.elements.filterBtns.forEach(button => { button.addEventListener('click', () => actionFiltersOnClick('filterBtn')) });
  state.elements.sortBtns.forEach(button => { button.addEventListener('click', () => actionFiltersOnClick('sortBtn')) });
  state.elements.applyFiltersBtn.addEventListener('click', () => applyFilters(false));
  state.elements.applySortBtn.addEventListener('click', () => applyFilters(false));
  state.elements.filterAccordionItems.forEach(input => { input.addEventListener('change', (e) => updateNewFilters(e, false)) });
  state.elements.sortItems.forEach(el => { el.addEventListener('click', (e) => updateNewFilters(e, true)) });
  state.elements.close_btn.forEach(button => { button.addEventListener('click', closeFiltersPanel) });  
  state.elements.filtersPanel.addEventListener('click', closeFiltersPanel);
  state.elements.clearAllBtn.addEventListener('click', () => applyFilters(true));
  state.elements.productGrid.addEventListener('click', onColorSelect);
  state.elements.productGrid.addEventListener('click', showQuickView);
};

const init = () => {
  cacheState();
  addEventListeners();
  disableAddToCartBtn();
};

onDocumentReady(() => {
  init();
});
