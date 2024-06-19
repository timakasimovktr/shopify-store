'use strict';
////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic --------------- */

var windowResizeTimeout;

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

function initAccordion($accordion, closeSiblings = false){
  var $accContent = $accordion.querySelector('.accordion__content');

  if(closeSiblings){
    $accordion.dataset.closeSiblings = closeSiblings;
  }
  
  if(!$accordion.dataset.initiated){
    $accordion.querySelector('.accordion__input').addEventListener('change', onAccordionStateChange);
    $accordion.dataset.initiated = true;
  }
  
  if($accordion.dataset.initOpen){
    openAccordion($accordion);
  }
}

function resizeAccordions(){
  document.querySelectorAll('.accordion:not([accordion-manual-mount]').forEach(($acc) => {
    var $accContent = $acc.querySelector('.accordion__content');
    
    initAccordion($acc);
  });
}

/* --------------- Utils & Tools --------------- */

function openAccordion($accordion){
  var $accContent = $accordion.querySelector('.accordion__content'),
  $iconMinus = $accordion.querySelector('.accordion__header > .kf-icon__minus'),
  $iconPlus = $accordion.querySelector('.accordion__header > .kf-icon__plus');
  
  if($iconMinus){
    $iconMinus.style.opacity = 1;
    $iconPlus.style.opacity = 0;
  }
  
  $accContent.classList.remove('hidden');

  $accordion.querySelector('.accordion__input').checked = true;

  if($accordion.dataset.closeSiblings){
    $accordion.parentNode.querySelectorAll('.accordion').forEach(($siblingAcc) => {
      if(!$accordion.isSameNode($siblingAcc)){
        closeAccordion($siblingAcc);
      }
    });
  }
}

function closeAccordion($accordion){
  var $accContent = $accordion.querySelector('.accordion__content'),
  $iconMinus = $accordion.querySelector('.accordion__header > .kf-icon__minus'),
  $iconPlus = $accordion.querySelector('.accordion__header > .kf-icon__plus');

  if($iconMinus){
    $iconMinus.style.opacity = 0;
    $iconPlus.style.opacity = 1;
  }
  
  $accContent.classList.add('hidden');
  $accordion.querySelector('.accordion__input').checked = false;
}

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */
  
  /* --------------- Events Setup --------------- */
  
  document.querySelectorAll('.accordion .accordion__input').forEach(($accInput) => {
    initAccordion($accInput.closest('.accordion'));
  });

  window.addEventListener('resize', (e) => {
    clearTimeout(windowResizeTimeout);

    windowResizeTimeout = setTimeout(() => {
      resizeAccordions();
    }, 250);
  }, true);

  /* --------------- Initialization--------------- */
  
  
  /* --------------- Window Export --------------- */
}

function onAccordionStateChange(e){
  const $accordion = e.currentTarget.closest('.accordion');
  
  if(e.currentTarget.checked){
    openAccordion($accordion);
  } else {
    closeAccordion($accordion);
  }
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export { initAccordion };