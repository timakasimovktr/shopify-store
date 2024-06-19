import ResponsiveImgConfig from '../types/responsive-img-config';

/**
 * 
 * @param {String} url
 * @param {ResponsiveImgConfig[]} configs
 * @param {String} defaultSize
 * @param {String} alt
 * @param {String[]} classes
 * @returns 
 */
export default (url, configs, defaultSize, alt, isLazyload, classes = []) => {
  var srcSets = [], sizes = [], getParamSeparator = '&';

  if(!url.includes('?')){
    url += '?';
    getParamSeparator = '';
  }
  
  configs.forEach(cfg => {
    srcSets.push(`${url}${getParamSeparator}width=${cfg.widthRes} ${cfg.imgWidth}w`);
    sizes.push(`(min-width: ${cfg.imgWidth}px) ${cfg.widthRes}px`);
  });

  sizes.push(defaultSize + 'px');

  if(isLazyload){
    return `
    <img class="${classes.join(' ')} lazyload"
      data-src="${srcSets[0]}"
      data-srcset="${srcSets.join(', ')}"
      data-sizes="${sizes.join(', ')}"
      alt="${alt}"
    >
  `;
  } else {
    return `
    <img class="${classes.join(' ')}"
      src="${srcSets[0]}"
      srcset="${srcSets.join(', ')}"
      sizes="${sizes.join(', ')}"
      alt="${alt}"
    >
  `;
  }
};