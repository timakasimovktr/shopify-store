(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const kanesCaresParent = document.querySelector("#kanesCares");
    const kanesCaresBtns = kanesCaresParent.querySelectorAll("[data-kanes-cares-btn]");
    const kanesCaresDivs = kanesCaresParent.querySelectorAll("[data-kanes-cares-div]");
  
    function removeActive(blocks) {
      blocks.forEach(block => {
        if(block.classList.contains("active")) {
          block.classList.remove("active");
        }
      });
    }

    kanesCaresBtns.forEach((btn, index) => {
      btn.addEventListener("click" , () => {
        if(!btn.classList.contains("active")) {
          removeActive(kanesCaresBtns);  
          removeActive(kanesCaresDivs);
          btn.classList.add("active");
          kanesCaresDivs[index].classList.add("active");
        }
        else {
          removeActive(kanesCaresBtns);  
          removeActive(kanesCaresDivs);
        }
      });
    });
    
  });
})();