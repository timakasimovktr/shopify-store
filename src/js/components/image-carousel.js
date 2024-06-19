function CardSwiper() {
  return new Swiper(".CardSwiper", {
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
}

function carouselSwiper() {
  return new Swiper(".carouselSwiper", {
    slidesPerGroup: 1,
    spaceBetween: 15,
    centerInsufficientSlides: true,
    loop: false,
    loopFillGroupWithBlank: false,
    navigation: {
      nextEl: ".carousel-button-next",
      prevEl: ".carousel-button-prev",
    },
    watchOverflow: true,
    breakpoints: {
      0: { slidesPerView: 2 },
      645: { slidesPerView: 3 },
      860: { slidesPerView: 4 },
      1075: { slidesPerView: 5 },
      1290: { slidesPerView: 6 },
      1500: { slidesPerView: 7 },
    },
  });
}

function initTabs(swiper) {
  const griditem = document.querySelectorAll(".griditem");
  const close_icon = document.querySelectorAll(".close_icon");
  const product_slide = document.querySelectorAll(
    ".product_carousel .swiper-slide"
  );
  const product_slider = document.querySelector(".product-slider");

  close_icon.forEach((item) => {
    item.addEventListener("click", () => {
      product_slider.style.display = "none";
      document.body.style.cssText = "";
    });
  });

  griditem.forEach((item, index) => {
    item.querySelector("img").addEventListener("click", () => {
      product_slider.style.display = "block";
      swiper.slideTo(index);
      document.body.style.cssText = "overflow: hidden; height: 100vh;";
    });
  });

  product_slide.forEach((item, index) => {
    item.addEventListener("click", () => {
      product_slider.style.display = "block";
      if (item.length > 7) {
        swiper.slideTo(item.dataset.swiperSlideIndex);
      } else {
        swiper.slideTo(index);
      }
      document.body.style.cssText = "overflow: hidden; height: 100vh;";
    });
  });

  if (product_slider) {
    product_slider.addEventListener("click", (e) => {
      if (e.target.classList.contains("product-slider")) {
        product_slider.style.display = "none";
        document.body.style.cssText = "";
      }
    });
  }
}

function relatedProductsCarousel(){
  return new Swiper(".swiper", {
    slidesPerGroup: 1,
    spaceBetween: 15,
    centerInsufficientSlides: true,
    loop: true,
    loopFillGroupWithBlank: false,
    watchOverflow: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      0: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1200: { slidesPerView: 3 },
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const swiper = CardSwiper();
  carouselSwiper();
  relatedProductsCarousel();
  initTabs(swiper);
});

if (window.Shopify?.designMode) {
  document.addEventListener("shopify:section:load", () => {
    const swiper = CardSwiper();
    carouselSwiper();
    initTabs(swiper);
  });
}
