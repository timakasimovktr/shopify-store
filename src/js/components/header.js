'use strict';

import { RESPONSIVE_BREAKPOINTS } from '../variables';
////////// Dependencies ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

import * as searchPopup from './search-popup';

////////// Constants & Variables ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Control & Logic for Mega Menu --------------- */

function menuController(){
  let mega_menu_content = document.querySelectorAll(".mega-menu__content");
  let mega_menu = document.querySelectorAll(".mega-menu");
  let header_inline_menu = document.querySelector(".header__inline-menu");
  let mega_menu_link_level_2 = document.querySelectorAll(".mega-menu__link--level-2");
  for (let i = 0; i < mega_menu.length; i++) {
    mega_menu[i].addEventListener("mouseover", function () {
      let mega_menu_content_width = mega_menu_content[i].offsetWidth;
      let mega_menu_width = mega_menu[i].offsetWidth;
      let mega_menu_left = mega_menu[i].offsetLeft;
      let mega_menu_content_left = mega_menu_left + mega_menu_width / 2 - mega_menu_content_width / 2;
      let mega_menu_content_right = mega_menu_content_left + mega_menu_content_width;
      let header_inline_menu_right = header_inline_menu.offsetWidth;
      if (mega_menu_content_left < 0) {
        mega_menu_content[i].style.left = 0;
      } else if (mega_menu_content_right > header_inline_menu_right) {
        mega_menu_content[i].style.left = "auto";
        mega_menu_content[i].style.right = 0;
      } else {
        mega_menu_content[i].style.left = mega_menu_content_left + "px";
      }
    });
  }

  const swiper = new Swiper(".FastLinkSwiper", {
    slidesPerView: 4,
    spaceBetween: 30,
    autoplay: {
      delay: 2500,
    },
    breakpoints: {
      0: {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
      },
      800: {
        slidesPerView: 2,
        spaceBetween: 30,
        loop: true,
      },
      1100: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
      1400: {
        slidesPerView: 4,
        spaceBetween: 30,
      },
    },
  });
}

document.addEventListener('DOMContentLoaded', menuController);

/* --------------- DOM --------------- */

////////// Functions & Methods //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/* --------------- Logic & Process --------------- */

/* --------------- Utils & Tools --------------- */

function collapseMenuItems(){
  document.querySelectorAll('.header__menu-item').forEach(($hm) => {
    var $details = $hm.closest('details');
    if($details && $details.getAttribute('open') == ''){
      $hm.click();
    }
  });
}

////////// Events ///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function countdownTimer() {
  const timerClocks = document.querySelectorAll('.timer-clock');
  timerClocks.forEach(timer => {
    const endDate = timer.getAttribute('data-time');
    const endDateParts = endDate.split(':');
    let Hours = parseInt(endDateParts[0]);
    let Minutes = parseInt(endDateParts[1]);
    let Seconds = parseInt(endDateParts[2]);

    const timerHours = timer.querySelector('.hours');
    const timerMinutes = timer.querySelector('.minutes');
    const timerSeconds = timer.querySelector('.seconds');

    if (isNaN(Hours) || isNaN(Minutes) || isNaN(Seconds)) {
      timer.querySelector('h3').textContent = 'Timer data is incorrect';
      return;
    }

    const UpdateTimer = setInterval(() => {
      let remainingTime = ((Hours * 60 + Minutes) * 60 + Seconds) * 1000;
      if (remainingTime <= 0) {
        clearInterval(UpdateTimer);
        timerHours.textContent = '00';
        timerMinutes.textContent = '00';
        timerSeconds.textContent = '00';
        return;
      }   
      let timeLeft = new Date(remainingTime - 1000);
      let hoursLeft = timeLeft.getUTCHours();
      let minutesLeft = timeLeft.getUTCMinutes();
      let secondsLeft = timeLeft.getUTCSeconds();

      timerHours.textContent = hoursLeft < 10 ? `0${hoursLeft}` : hoursLeft;
      timerMinutes.textContent = minutesLeft < 10 ? `0${minutesLeft}` : minutesLeft;
      timerSeconds.textContent = secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft;
      Hours = hoursLeft;
      Minutes = minutesLeft;
      Seconds = secondsLeft;
    }, 1000);
  });
}


document.addEventListener('DOMContentLoaded', countdownTimer);
if (window.Shopify?.designMode) {
  document.addEventListener("shopify:section:load", countdownTimer);
}

function onDocumentLoaded(){
  const storeLocations = JSON.parse(window.StoreLocations);
  const storeLocationsArray = storeLocations.map((store) => {
    return {
      name: store.name,
      address: store.address,
      hours_weekdays: store.hours_weekdays,
      hours_weekends: store.hours_weekends,
      latitude: store.latitude,
      longitude: store.longitude,
      showOnLocator: store.show_on_locator,
      store_page: store.store_page
    };
  });

  const nearestStoreName = document.getElementById('nearest-store-name');
  const nearestStoreUrl = document.getElementById('nearest-store-url');
  const nearestStoreHeading = document.getElementById('nearest-store-heading');
  const showStores = document.getElementById('show-stores');
  const chooseLocations = document.getElementById('choose-locations');
  const closeLocations = document.getElementById('close-locations-menu');
  const nearestSpinnerIcon = document.getElementById('nearest-spinner-icon').querySelector('svg').outerHTML;
  showStores.addEventListener('click', () => {
      chooseLocations.style.display = 'block';
  });

  closeLocations.addEventListener('click', () => {
      chooseLocations.style.display = 'none';
  });

  storeLocationsArray.forEach((store) => {
    let today = new Date().getDay();
    if(today == 0) {
      store.hours = store.hours_weekends;
    } else {
      store.hours = store.hours_weekdays;
    }
    if(localStorage.getItem('store')) {
      nearestStoreName.innerHTML = localStorage.getItem('store');
      nearestStoreName.dataset.zipcode = localStorage.getItem('zipcode');
      nearestStoreUrl.href = localStorage.getItem('storeUrl');
      nearestStoreHeading.innerHTML = localStorage.getItem('storeHeading');
    } else {
      if(store.name.includes('Naples')){
        nearestStoreName.innerHTML = store.name + ': Today - <span>' + store.hours + '</span>';
        nearestStoreName.dataset.zipcode = store.address.match(/\d+$/)?.[0].trim();
        nearestStoreUrl.href = '/pages/' + store.store_page;
        nearestStoreHeading.innerHTML = 'Nearest Store';
      }
    }
    
    const location = document.createElement('div');
    const zipCode = store.address.match(/\d+$/)?.[0].trim();
    location.classList.add('location');
    location.innerHTML = `
    <div class="left">
      <h3 class="store-name" data-zipcode="${zipCode}">${store.name} : Today - <span>${store.hours}</span></h3>
    </div>
    <div class="right">
      <div aria-url="${store.store_page}" class="choose-location-button">Choose<br>Location</div>
    </div>
    `;
    chooseLocations.appendChild(location);
  });
  
  navigator.geolocation.getCurrentPosition(showPosition);

  let chooseLocationButtons = document.querySelectorAll('.choose-location-button');
  chooseLocationButton();
  
  function getNearestStore(latitude, longitude, stores) {
    const R = 6371;
    const getDistance = (lat1, lon1, lat2, lon2) => {
      return Math.round((Math.sqrt(Math.pow(69.1 * (lat1 - lat2), 2) + 
             Math.pow(69.1 * (lon1 - lon2) * 
             Math.cos(lat2 / 57.3), 2))) * 10) / 10;
    };
    const closestStore = stores.reduce((acc, store) => {
      const distance = getDistance(latitude, longitude, store.latitude, store.longitude);
      store.distance = distance;
      return distance < acc.distance ? store : acc;
    }, { distance: Number.MAX_VALUE });
  
    return closestStore;
  }
  
  function toRad(Value) {
      return Value * Math.PI / 180;
  }

  function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
  
    const nearestStore = getNearestStore(latitude, longitude, storeLocationsArray);
    nearestStoreName.innerHTML = nearestStore.name + ' : Today - <span>' + nearestStore.hours + '</span>';
    nearestStoreName.dataset.zipcode = nearestStore.address.match(/\d+$/)?.[0].trim();
    nearestStoreUrl.href = '/pages/' + nearestStore.store_page;
    nearestStoreHeading.innerHTML = 'Nearest Store';
    
    storeLocationsArray.sort((a, b) => {
      return a.distance - b.distance;
    });

    chooseLocations.querySelectorAll('.location').forEach((location) => {
      location.remove();
    });
    
    storeLocationsArray.forEach((store) => {
      const zipCode = store.address.match(/\d+$/)?.[0].trim();

      if(store.showOnLocator === false) return;
      const location = document.createElement('div');
      location.classList.add('location');
      location.innerHTML = `
        <div class="left">
          <h3 class="store-name" data-zipcode="${zipCode}">${store.name} : Today - <span>${store.hours}</span></h3>
          <p class="distance">${store.distance.toFixed(2)} miles</p>
        </div>
        <div class="right">
          <div aria-url="${store.store_page}" class="choose-location-button">Choose<br>Location</div>
        </div>
      `;
      chooseLocations.appendChild(location);
    });

    chooseLocationButtons = document.querySelectorAll('.choose-location-button');
    chooseLocationButton()
  }

  function chooseLocationButton(){
    chooseLocationButtons.forEach((button) => {
      button.addEventListener('click', () => {
        nearestStoreName.innerHTML = button.closest('.location').querySelector('.store-name').innerHTML;
        nearestStoreName.dataset.zipcode = button.closest('.location').querySelector('.store-name').dataset.zipcode;
        nearestStoreUrl.href = '/pages/' + button.getAttribute('aria-url');
        nearestStoreHeading.innerHTML = 'Selected Store';
        localStorage.setItem('store', nearestStoreName.innerHTML);
        localStorage.setItem('zipcode', nearestStoreName.dataset.zipcode);
        localStorage.setItem('storeUrl', nearestStoreUrl.href);
        localStorage.setItem('storeHeading', nearestStoreHeading.innerHTML);
        button.innerHTML = nearestSpinnerIcon;
        setTimeout(() => {
          nearestStoreName.innerHTML = button.closest('.location').querySelector('.store-name').innerHTML;
          nearestStoreName.dataset.zipcode = button.closest('.location').querySelector('.store-name').dataset.zipCode;
          nearestStoreUrl.href = '/pages/' + button.getAttribute('aria-url');
          nearestStoreHeading.innerHTML = 'Selected Store';
          button.innerHTML = 'Choose <br> Location';
          chooseLocations.style.display = 'none';
        }, 1000);
      });
    });
  }

  document.querySelectorAll('.header__menu-item').forEach(($hm) => {
    $hm.addEventListener('mouseover', headerMenuItemOnHover);
  });
  
  document.querySelector('.header-wrapper-menu-content').addEventListener('mouseleave', () => {
    collapseMenuItems();
  });
}

function headerMenuItemOnHover(e){
  var $menuItem = e.currentTarget;

  collapseMenuItems();

  if($menuItem.tagName == 'SUMMARY' && $menuItem.getAttribute('aria-expanded') != 'true'){
    $menuItem.click();
  }
}

if(document.readyState != 'loading'){
  onDocumentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
}

////////// Classes //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
