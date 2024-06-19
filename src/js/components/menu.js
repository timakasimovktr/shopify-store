'use strict';

import { onDocumentReady } from "../utils/dom";

const state = {
  elements: {},
}

const cacheState = () => {
  state.elements = {
    navigation: document.querySelector('.menu-drawer__navigation'),
    mobileMenuCloseBtn: document.querySelector('header-drawer .kf-icon__close'),
    menuToggleBtn: document.querySelector('header-drawer .header__icon--menu'),
  }
}

const accordionInit = (e) => {
  if(e.target.closest('.accordion_item')){
    e.target.closest('.accordion_item').classList.toggle('open');
  }
}

const closeMenu = () => {
  state.elements.menuToggleBtn.click();
}

const addEventListeners = () => {
  state.elements.navigation.addEventListener('click', (e) => {
    accordionInit(e);
  });
  state.elements.mobileMenuCloseBtn.addEventListener('click', () => {
    closeMenu();
  });
}

const init = () => {
  cacheState();
  addEventListeners();
}

onDocumentReady(() => {
  init();
});
