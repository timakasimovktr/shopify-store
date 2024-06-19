export default function handleProductColor() {
  const cardInformations = document.querySelectorAll('.card__information');

  cardInformations.forEach((cardInformation) => {
    const relatedProductColors = cardInformation.querySelector('.related-product-colors');
    const addToCartButton = cardInformation.querySelector('.add-to-cart');
    if (relatedProductColors && addToCartButton && !addToCartButton.dataset.colorChosen) {
      addToCartButton.classList.add('disabled');
      addToCartButton.disabled = true;
    }
  });

  document.addEventListener('click', (event) => {
    const productColorOption = event.target.closest('.product-color-option-wrapper');
    if (productColorOption) {
      const variantId = productColorOption.dataset.variantId;
      const productUrl = productColorOption.dataset.productUrl;
      const cardInformation = productColorOption.closest('.card__information');

      if (cardInformation) {
        const addToCartButton = cardInformation.querySelector('.add-to-cart');
        if (addToCartButton && window.LC && window.LC.quickBuy) {
          addToCartButton.classList.remove('disabled');
          addToCartButton.disabled = false;
          addToCartButton.dataset.variantId = variantId;
          addToCartButton.dataset.colorChosen = 'true';
        }

        const productColorOptions = cardInformation.querySelectorAll('.product-color-option-wrapper');
        productColorOptions.forEach((el) => {
          el.classList.remove('active');
        });

        // If window.LC.quickBuy is false, redirect to the product page
        if (window.LC && !window.LC.quickBuy) {
          window.location.href = productUrl;
        } else {
          // Only add 'active' class if window.LC.quickBuy is true
          productColorOption.classList.add('active');
        }
      }
    }
  });
}
