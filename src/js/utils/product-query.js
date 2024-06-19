export const normalizeGQLResponse = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  Object.keys(obj).forEach(key => {
    if (['data', 'node', 'edges', 'nodes', 'collectionByHandle'].includes(key)) {
      obj = normalizeGQLResponse(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map((inner) => normalizeGQLResponse(inner));
    } else {
      obj[key] = normalizeGQLResponse(obj[key]);
    }
  });

  return obj;
};

export const getProductBySku = async (sku, reqId = null, storefrontKey) => {
  const query = `
  {
    collectionByHandle(handle: "warranties") {
      products(first: 50) {
        edges {
          node {
            id
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  sku
                  title
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  `;
  
  const url = "/api/2023-04/graphql.json";

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': `${storefrontKey}`,
    },
    body: JSON.stringify({
      query: query,
      variables: {
        filter: "sku:" + sku,
      },
    }),
  });

  const resJson = await res.json();
  const normalizedRes = normalizeGQLResponse(resJson);

  const products = normalizedRes?.products?.filter((product) => {
    return product.variants[0].sku === sku;
  }) || [];

  products.forEach((product) => {
    product.variants[0].id = product.variants[0].id.replace('gid://shopify/ProductVariant/', '');
    return product;
  });

  return {
    results: products,
    reqId: reqId
  };
};
