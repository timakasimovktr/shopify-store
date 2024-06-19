import { stringToHtml } from "../utils/parsers";

// Fetch related color products
const fetchRelatedColorProducts = async (productHandle) => {
  const response = await fetch(`/products/${productHandle}?view=ss-metafields-json`);
  return response.json();
};

// Generate the color-related products markup
const generateColorRelatedProductsMarkup = (colorRelatedProducts) => {
  let crpIndex = 1;
  let colorRelatedProductsMarkup = '';

  colorRelatedProducts.forEach((crp) => {
    if (crp.colorCode && crp.colorName) {
      let colorCodeToUse = crp.colorCode;
      if (colorCodeToUse && colorCodeToUse.toLowerCase() === '#ffffff' || colorCodeToUse.toLowerCase() === '#fff') {
        colorCodeToUse = '#f1f1f1';
      }
      colorRelatedProductsMarkup += `
        <a class="product-color-option-wrapper" data-variant-id="${crp.colorVariantId}" data-product-url="${crp.url}">
          <label for="product-color-option-${crpIndex}">
            <div class="related-product-color" style="background-color: ${colorCodeToUse}"></div>
            <span class="related-product-color__name">${crp.colorName}</span>
          </label>
        </a>
      `;
      crpIndex++;
    }
  });
  

  return colorRelatedProductsMarkup;
};

// Append the color-related products markup to the card information inner div
const appendColorRelatedProducts = ($product, colorRelatedProductsMarkup) => {
  const baseColorRelatedProductMarkup = `
    <div class="related-product-color-container">
        <div class="related-product-colors">${colorRelatedProductsMarkup}</div>
    </div>
    `;

  const cardInformationInner = $product.querySelector('.card__information-inner');
  if (!cardInformationInner.querySelector('.related-product-color-container')) {
    cardInformationInner.appendChild(stringToHtml(baseColorRelatedProductMarkup));
  }

};

// The main function
export default async ($productsWithRelatedColors) => {
  for (let i = 0; i < $productsWithRelatedColors.length; i++) {
    const $product = $productsWithRelatedColors[i];

    if (!$product.querySelector('.related-product-color-container')) {
      const productHandle = $product.dataset.handle;
      const colorRelatedProducts = await fetchRelatedColorProducts(productHandle);
      const colorRelatedProductsMarkup = generateColorRelatedProductsMarkup(colorRelatedProducts);
      appendColorRelatedProducts($product, colorRelatedProductsMarkup);
    }
  }
};
