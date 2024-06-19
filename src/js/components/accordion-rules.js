// Wait for the DOM to be loaded
document.addEventListener('DOMContentLoaded', function () {
  // Split content
  let content = window.pageContent;

  if (content === undefined || content === null) {
    return; // return early if content is missing or invalid
  }

  content = content.replace(/(<h2>)/g, function(match, p1, offset, string) {
    if (offset === 0) {
      return p1;
    } else {
      return "&&&" + p1; 
    }
  });

  var contentArray = content.split("&&&");
  var contentList = "";
  for (var i = 0; i < contentArray.length; i++) {
    contentArray[i] = contentArray[i].replace(/<\/p>\s*<p>/g, "</p><br><br><p>");
    contentArray[i] = contentArray[i].replace(/(<\/p>)/g, "").replace(/(<p>)/g, "");
    contentArray[i] = contentArray[i].replace(/(<\/h2>)/g, "</h2><p>"); 
    contentList += "<li>" + contentArray[i] + "</li>";
  }
  document.querySelectorAll(".container ul").forEach(function (el) {
      el.innerHTML = contentList;
  });

  // Accordion for terms and legal mobile
  let legal_mobile = document.querySelector('.legal-mobile');

  function addClass(el, className) {
    for (let i = 0; i < el.length; i++) {
      el[i].classList.add(...className);
    }
  }

  if(legal_mobile){
      addClass(legal_mobile.querySelectorAll("h2"), ["js-acc-btn"]);
      addClass(legal_mobile.querySelectorAll("p"), ["js-acc-menu", "acc__menu"]);
  } 

  // Accordion functionality
  let js_acc_btn = document.querySelectorAll(".js-acc-btn");
  let js_acc_menu = document.querySelectorAll(".js-acc-menu");
  let active_acc = null;

  for (let i = 0; i < js_acc_btn.length; i++) {
    js_acc_btn[i].addEventListener("click", function () {
      if (this.classList.contains("is-active")) {
        this.classList.remove("is-active");
        js_acc_menu[i].classList.remove("is-open");
        js_acc_menu[i].style.height = "0px";
        active_acc = null;
      } else {
        if (active_acc) {
          active_acc.btn.classList.remove("is-active");
          active_acc.menu.style.height = "0px";
          active_acc.menu.classList.remove("is-open");
        }
        this.classList.add("is-active");
        js_acc_menu[i].classList.add("is-open");
        active_acc = {btn: this, menu: js_acc_menu[i]};
        var js_acc_height = js_acc_menu[i].scrollHeight + 20;
        js_acc_menu[i].style.height = js_acc_height + "px";
      }
    });
  }
});