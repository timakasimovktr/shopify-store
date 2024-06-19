(() => {
  const acc_btn = document.querySelectorAll(".title_div");
  const visible_acc_item = document.querySelectorAll(".content_div");
  const edit_button = document.querySelectorAll(".edit_button");
  const address_name = document.querySelectorAll(".address_name");
  const edit_delete_buttons = document.querySelectorAll(".input_buttons");
  const edit_address_inputs = document.querySelectorAll(".edit_address_inputs");
  const addAddress_button = document.querySelectorAll(".addAddress_button");
  const addAddress = document.querySelectorAll(".AddAddress");
  const data_list_addressess_ul = document.querySelectorAll(
    ".data-list-addressess-ul"
  );
  const data_list_addressess = document.querySelectorAll(
    ".data-list-addressess"
  );
  const cancel_edit_button = document.querySelectorAll(".cancel_edit_button");
  const add_address_cancel_button = document.querySelectorAll(
    ".add_address_cancel_button"
  );

  visible_acc_item[0].classList.add("active");
  acc_btn[0].classList.add("active");
  for (let i = 0; i < acc_btn.length; i++) {
    acc_btn[i].addEventListener("click", function () {
      for (let i = 0; i < visible_acc_item.length; i++) {
        visible_acc_item[i].classList.remove("active");
        acc_btn[i].classList.remove("active");
      }
      visible_acc_item[i].classList.add("active");
      acc_btn[i].classList.add("active");
      active_acc = visible_acc_item[i];
    });
  }

  for (let i = 0; i < edit_button.length; i++) {
    edit_button[i].addEventListener("click", function () {
      for (let i = 0; i < address_name.length; i++) {
        address_name[i].style.display = "none";
      }
      for (let i = 0; i < edit_delete_buttons.length; i++) {
        edit_delete_buttons[i].style.display = "none";
      }
      for (let i = 0; i < data_list_addressess.length; i++) {
        data_list_addressess[i].style.marginBottom = 0;
      }
      for (let i = 0; i < addAddress_button.length; i++) {
        addAddress_button[i].style.display = "none";
      }
      edit_address_inputs[i].style.display = "block";
    });
  }

  for (let i = 0; i < cancel_edit_button.length; i++) {
    cancel_edit_button[i].addEventListener("click", function () {
      for (let i = 0; i < address_name.length; i++) {
        address_name[i].style.display = "block";
      }
      for (let i = 0; i < data_list_addressess.length; i++) {
        data_list_addressess[i].style.marginBottom = "50px";
      }
      for (let i = 0; i < edit_delete_buttons.length; i++) {
        edit_delete_buttons[i].style.display = "block";
      }
      for (let i = 0; i < addAddress_button.length; i++) {
        addAddress_button[i].style.display = "block";
      }
      for (let i = 0; i < edit_address_inputs.length; i++) {
        edit_address_inputs[i].style.display = "none";
      }
    });
  }
  for (let i = 0; i < addAddress_button.length; i++) {
    addAddress_button[i].addEventListener("click", function () {
      for (let i = 0; i < address_name.length; i++) {
        address_name[i].style.display = "none";
      }
      for (let i = 0; i < edit_delete_buttons.length; i++) {
        edit_delete_buttons[i].style.display = "none";
      }
      for (let i = 0; i < addAddress_button.length; i++) {
        addAddress_button[i].style.display = "none";
      }
      for (let i = 0; i < data_list_addressess_ul.length; i++) {
        data_list_addressess_ul[i].style.display = "none";
      }
      for (let i = 0; i < edit_address_inputs.length; i++) {
        edit_address_inputs[i].style.display = "none";
      }
      for (let i = 0; i < addAddress.length; i++) {
        addAddress[i].style.display = "block";
      }
      for (let i = 0; i < add_address_cancel_button.length; i++) {
        add_address_cancel_button[i].style.display = "block";
     }
    });
  }

  for (let i = 0; i < add_address_cancel_button.length; i++) {
      add_address_cancel_button[i].addEventListener("click", function () {
        for (let i = 0; i < data_list_addressess_ul.length; i++) {
          data_list_addressess_ul[i].style.display = "block";
        }
        for (let i = 0; i < address_name.length; i++) {
          address_name[i].style.display = "block";
        }
        for (let i = 0; i < edit_delete_buttons.length; i++) {
          edit_delete_buttons[i].style.display = "block";
        }
        for (let i = 0; i < addAddress_button.length; i++) {
          addAddress_button[i].style.display = "block";
        }
        for (let i = 0; i < add_address_cancel_button.length; i++) {
            add_address_cancel_button[i].style.display = "none";
        }
        for (let i = 0; i < addAddress.length; i++) {
            addAddress[i].style.display = "none";
        }
      });
  }

  var js_acc_btn = document.querySelectorAll(".account_tab_title");
  var js_acc_menu = document.querySelectorAll(".account_tab_content");
  let active_acc = null;

  for (let i = 0; i < js_acc_btn.length; i++) {
    js_acc_btn[i].addEventListener("click", function () {
      if (js_acc_menu[i].classList.contains("is-open")) {
        js_acc_menu[i].classList.remove("is-open");
        js_acc_menu[i].style.height = "0px";
        active_acc = null;
      } else {
        if (active_acc) {
          active_acc.style.height = "0px";
          active_acc.classList.remove("is-open");
        }
        js_acc_menu[i].classList.add("is-open");
        active_acc = js_acc_menu[i];
        var js_acc_height = js_acc_menu[i].scrollHeight + 40;
        js_acc_menu[i].style.height = js_acc_height + "px";
      }
    });
  }
})();
