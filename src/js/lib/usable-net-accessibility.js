'use strict';

function onDocumentLoaded(){
  const accessibilityToggleBtn = document.querySelector('#accessibility-usable-net-btn');
  
  if(accessibilityToggleBtn){
    accessibilityToggleBtn.classList.add('UsableNetAssistive');
    accessibilityToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.enableUsableNetAssistive();
    });
  }
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

export { };