document.addEventListener("DOMContentLoaded", function () {
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
        active_acc = { btn: this, menu: js_acc_menu[i] };
        var js_acc_height = js_acc_menu[i].scrollHeight + 20;
        js_acc_menu[i].style.height = js_acc_height + "px";
      }
    });
  }
});
