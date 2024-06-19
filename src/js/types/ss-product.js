export default class SSProduct {
  id;
  sku;
  handle;
  title;
  price;
  compareAtPrice;
  url;
  featuredImageUrl;
  secondaryImageUrl;
  colorRelatedHandles;
  collectionSubheader;
  closeout;
  variantId;
  tags;
  
  constructor(id, sku, handle, title, price, compareAtPrice, url, featuredImageUrl, secondaryImageUrl, colorRelatedHandles, collectionSubheader, closeout, isNew, variantId, tags, iscSoon) {
    this.id = id;
    this.sku = sku;
    this.handle = handle;
    this.title = title;
    this.price = price;
    this.compareAtPrice = compareAtPrice;
    this.url = url;
    this.featuredImageUrl = featuredImageUrl;
    this.secondaryImageUrl = secondaryImageUrl;
    this.colorRelatedHandles = colorRelatedHandles ? colorRelatedHandles : [];
    this.collectionSubheader = collectionSubheader;
    this.closeout = closeout == '1';
    this.isNew = isNew == '1';
    this.variantId = variantId;
    this.tags = tags;
    this.iscSoon = iscSoon == '1';
  }
}