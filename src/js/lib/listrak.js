'use strict';

////////// Dependencies ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

let $newsletterSignupInput, $newsletterSignupForm, $newsletterSentMsg, formSentTimeout;

/* --------------- Control & Logic --------------- */

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

/* --------------- Utils & Tools --------------- */

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function onDocumentLoaded(){
  /* --------------- Variable Cache --------------- */

  $newsletterSignupForm = document.querySelector('#newsletter-form');
  $newsletterSignupInput = $newsletterSignupForm.querySelector('#newsletter-form__email-input');
  $newsletterSentMsg = $newsletterSignupForm.querySelector('.newsletter-form__ajax__form-sent-msg');
  
  /* --------------- Events Setup --------------- */

  if($newsletterSignupForm && $newsletterSignupForm?.dataset.ajaxSubmit){
    $newsletterSignupForm.addEventListener('submit', newsletterSignupOnSubmit);
  }

  /* --------------- Initialization--------------- */
}

function newsletterSignupOnSubmit(e){
  e.preventDefault();
  if(window._ltk){
    clearTimeout(formSentTimeout);

    window._ltk.Signup.New('Footer', 'newsletter-form__email-input', _ltk.Signup.TYPE.CLICK, 'newsletter-form__submit', 'email');

    $newsletterSentMsg.classList.remove('hidden');

    formSentTimeout = setTimeout(() => {
      $newsletterSentMsg.classList.add('hidden');
    }, 2000);
  } else {
    console.warn('Listrak did not load yet');
  }
}

document.addEventListener('DOMContentLoaded', onDocumentLoaded);

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////