'use strict';

import { onDocumentReady } from "../utils/dom";
import { debounce } from "../utils/performance";

const state = {
  parser: new DOMParser(),
};

const cacheState = () => {
  state.elements = {
    ...state.elements,
    searchInput: document.querySelector('.search-popup__search-input'),
    searchPopup: document.querySelector('.search-popup__preview-container'),
    searchProductsContainer: document.querySelector('.search-popup__results'),
    alternativesWrapper: document.querySelector(".alternatives-wrapper"),
    sectionHeader: document.querySelector('.section-header'), 
    searchClose: document.querySelector('.search-popup-close'),
    searchLoader: document.querySelector('.search-popup-loader'),
    searchIcon: document.querySelector('.search-popup-search'),
  }
};

const getSuggestedProducts = async (e) => {
  const { 
    searchPopup, 
    searchIcon,
    searchLoader,
    searchProductsContainer,
    alternativesWrapper,
    searchClose,
  } = state.elements;
  searchPopup.style.display = 'none';
  searchClose.classList.add('hidden');
  searchIcon.classList.add('hidden');
  searchLoader.classList.remove('hidden');
  const searchQuery = e.target.value;
  try {
    searchProductsContainer.innerHTML = '';
    alternativesWrapper.innerHTML = '';
    const response = await fetch(`/search?q=${searchQuery}&section_id=search-results`);
    const htmlMarkup = state.parser.parseFromString(await response.text(), 'text/html');
    const containerWithSuggestions = htmlMarkup.querySelectorAll('#product-grid .grid__item');
    if (containerWithSuggestions.length < 1) return;
    getAlternatives(containerWithSuggestions);
    containerWithSuggestions.forEach((suggestion, index) => {
      if (index < 10) {
        searchProductsContainer.appendChild(suggestion);
      }
    });
    searchPopup.style.display = 'block';
  } catch (error) {
    console.error('Error fetching suggested products', error);
  } finally {
    searchLoader.classList.add('hidden');
    if (searchQuery != "") {
      searchClose.classList.remove('hidden');
    } else {
      searchIcon.classList.remove('hidden');
    }
  }
};

const getAlternatives = async (containerWithSuggestions) => {
  try {
    containerWithSuggestions.forEach((suggestion, index) => {
      if (index < 6) {
        const suggestionTitle = suggestion.querySelector('.card__heading a').textContent;
        const suggestionUrl = suggestion.querySelector('.card__heading a').getAttribute('href');
        const suggestionMarkup = `
          <li class="alternatives__item">
            <a title="${suggestionTitle}" href="/search?q=${suggestionTitle}" class="search-popup__result">${suggestionTitle}</a>
          </li>
        `;
        state.elements.alternativesWrapper.insertAdjacentHTML('beforeend', suggestionMarkup);
      }
    }); 
  } catch (error) {
    console.error('Error fetching suggestions', error);
  }
}

const activateSearchInput = () => {
  state.elements.searchInput.removeAttribute('readonly');
};

const showSearchPopup = () => {
  if(state.elements.sectionHeader.classList.contains('shopify-section-header-hidden')) {
    state.elements.searchPopup.style.display = 'none';
  } else {
    if(state.elements.searchProductsContainer.innerHTML.trim() == "") return;
    state.elements.searchPopup.style.display = 'block';
  }
}

const onSearch = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    window.location.href = `/search?q=${e.target.value}`;
  }
}

const closeSearchPopup = () => {
  const { 
    searchPopup, 
    searchProductsContainer, 
    alternativesWrapper,
    searchInput,
    searchClose,
    searchIcon,
  } = state.elements;
  searchPopup.style.display = 'none';
  searchProductsContainer.innerHTML = '';
  alternativesWrapper.innerHTML = '';
  searchInput.value = ''; 
  searchClose.classList.add('hidden');
  searchIcon.classList.remove('hidden');
}

const addEventListeners = () => {
  state.elements.searchInput.addEventListener('click', activateSearchInput, { once: true });
  state.elements.searchInput.addEventListener('input', debounce(getSuggestedProducts, 500));
  window.addEventListener('scroll', showSearchPopup);
  state.elements.searchInput.addEventListener('keydown', onSearch);
  state.elements.searchClose.addEventListener('click', closeSearchPopup);
};

const init = () => {
  cacheState();
  addEventListeners();
};

onDocumentReady(() => {
  init();
});