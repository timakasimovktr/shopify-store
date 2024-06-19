import Glide from '@glidejs/glide';
function InitGlide() {  
  new Glide(".glide", {
    peek: 15,
    perView: 3,
    type: "carousel",
    breakpoints: {
      1024: {
        perView: 1,
        focusAt: "center"
      },
    }
  }).mount();
}

document.addEventListener("DOMContentLoaded", InitGlide);

if (window.Shopify?.designMode) {
  document.addEventListener("shopify:section:load", InitGlide);
}