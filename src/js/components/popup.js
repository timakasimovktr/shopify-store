'use strict';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

const FADE_ANIMATION_MS = 300;

/* --------------- Control & Logic --------------- */

var popupVisibilityTimeout, onOk, onCancel;

/* --------------- DOM --------------- */

var $popup, $popupWrapper, $popupCloseBtn, $popupTitle, $popupContent, $popupOkBtn, $popupCancelBtn;

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

function showPopup(show, popupConfigs, popupStyles){
  if(popupVisibilityTimeout){
    clearTimeout(popupVisibilityTimeout);
  }

  if(!popupConfigs){
    popupConfigs = new PopupConfigs();
  }
  if(!popupStyles){
    popupStyles = new PopupStyles();
  }
  

  if(show){
    applyPopupConfigs(popupConfigs, popupStyles);

    // --------------- --------------- ---------------

    $popup.classList.remove('d-none');
    popupVisibilityTimeout = setTimeout(() => {
      $popup.style.opacity = 1;
    }, FADE_ANIMATION_MS);
    document.querySelector('body').style.overflowY = 'hidden';
  } else {
    $popup.style.opacity = 0;
    popupVisibilityTimeout = setTimeout(() => {
      $popup.classList.add('d-none');
      resetPopup();
    }, FADE_ANIMATION_MS);

    document.querySelector('body').style.overflowY = '';
  }
}

function applyPopupConfigs(popupConfigs, popupStyles){
  // --------------- Information and content ---------------

  $popupTitle.innerText = popupConfigs.title;
  $popupContent.innerHTML = popupConfigs.htmlContent;
  $popupOkBtn.innerText = popupConfigs.okBtnText;
  $popupCancelBtn.innerText = popupConfigs.cancelBtnText;
  onOk = popupConfigs.onOkCallback;
  onCancel = popupConfigs.onCancelCallback;

  // --------------- Styling ---------------

  $popupWrapper.style.padding = popupStyles.wrapperPadding;
  $popupContent.style.padding = popupStyles.contentPadding;

  if(!popupStyles.showTitle){
    $popupTitle.classList.add('d-none');
  } else {
    $popupTitle.classList.remove('d-none');
  }

  if(!popupConfigs.htmlContent){
    $popupContent.classList.add('d-none');
  } else {
    $popupContent.classList.remove('d-none');
  }
  
  if(!popupStyles.showButtons){
    $popupOkBtn.classList.add('d-none');
    $popupCancelBtn.classList.add('d-none');
  } else {
    $popupOkBtn.classList.remove('d-none');
    $popupCancelBtn.classList.remove('d-none');
  }

  if(popupStyles.iconCloseShowBg){
    $popupCloseBtn.classList.add('bg');
  } else {
    $popupCloseBtn.classList.remove('bg');
  }
}

/* --------------- Utils & Tools --------------- */

function resetPopup(){
  applyPopupConfigs(new PopupConfigs(), new PopupStyles());
}

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  $popup = document.querySelector('.kf-popup');
  if(!$popup){
    return;
  }
  $popupWrapper = document.querySelector('.kf-popup__content-wrapper');
  $popupCloseBtn = $popup.querySelector('.kf-icon__close');
  $popupTitle = $popup.querySelector('.kf-popup__title');
  $popupContent = $popup.querySelector('.kf-popup__content');
  $popupOkBtn = $popup.querySelector('.kf-popup__confirm');
  $popupCancelBtn = $popup.querySelector('.kf-popup__cancel');
  
  /* --------------- Events Setup --------------- */

  $popupCloseBtn.addEventListener('click', cancelOnClick);
  $popupOkBtn.addEventListener('click', okOnClick);
  $popupCancelBtn.addEventListener('click', cancelOnClick);

  /* --------------- Initialization--------------- */
  
  /* --------------- Window Export --------------- */
}

function okOnClick(){
  showPopup(false);

  if(typeof onOk == 'function'){
    onOk();
  }
}

function cancelOnClick(){
  showPopup(false);

  if(typeof onCancel == 'function'){
    onCancel();
  }
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

class PopupConfigs {
  title;
  htmlContent;
  okBtnText;
  cancelBtnText;
  onOkCallback;
  onCancelCallback;

  constructor(title, htmlContent, okBtnText, cancelBtnText, onOkCallback, onCancelCallback){
    this.title = title || 'Title';
    this.htmlContent = htmlContent;
    this.okBtnText = okBtnText || 'Confirm';
    this.cancelBtnText = cancelBtnText || 'Cancel';
    this.onOkCallback = onOkCallback;
    this.onCancelCallback = onCancelCallback;
  }
}

class PopupStyles {
  wrapperPadding;
  contentPadding;
  iconCloseShowBg;
  showTitle;
  showButtons;

  constructor(wrapperPadding, contentPadding, iconCloseShowBg, showTitle, showButtons){
    this.wrapperPadding = wrapperPadding || '';
    this.contentPadding = contentPadding || '';
    this.iconCloseShowBg = iconCloseShowBg != undefined ? iconCloseShowBg : false;
    this.showTitle = showTitle != undefined ? showTitle : true;
    this.showButtons = showButtons != undefined ? showButtons : true;
  }
}

////////// Exports //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export { showPopup, PopupConfigs, PopupStyles};