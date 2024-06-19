export default class SSFilter {
  name;
  type;
  value;
  min;
  max;
  
  constructor(name, type, value, min, max) {
    this.name = name;
    this.type = type;
    this.value = value;
    this.min = min;
    this.max = max;
  }

  getUrlFilter(){
    switch(this.type){
      case 'range':
        return `filter.${this.name}.low=${this.min}&filter.${this.name}.high=${this.max}`;
      case 'refine-query':
        return `rq=${this.value}`;
      default:
        return `filter.${this.name}=${this.value}`;
    }
  }
}