class SevenSegmentDigit extends HTMLElement {
  static get observedAttributes() {
    return ['digit']; 
  }
  
  constructor(){
    super();

    this.digitId = 0;
  }


  createSegments(){
    this.seg_a = document.createElement('div')
    this.seg_a.className = 'segment a'
    
    this.seg_b = document.createElement('div')
    this.seg_b.className = 'segment b'
    
    this.seg_c = document.createElement('div')
    this.seg_c.className = 'segment c'
    
    this.seg_d = document.createElement('div')
    this.seg_d.className = 'segment d'
    
    this.seg_e = document.createElement('div')
    this.seg_e.className = 'segment e'
    
    this.seg_f = document.createElement('div')
    this.seg_f.className = 'segment f'
    
    this.seg_g = document.createElement('div')
    this.seg_g.className = 'segment g'
    
    this.seg_g_top = document.createElement('div')
    this.seg_g_top.className = 'top';
    this.seg_g_bottom = document.createElement('div')
    this.seg_g_bottom.className = 'bottom';

    this.seg_g.append(this.seg_g_top, this.seg_g_bottom);

    // this.append(this.seg_a, this.seg_b, this.seg_c, this.seg_d, this.seg_e, this.seg_f, this.seg_g);
  }

  changeDisplay(){
    let digit = this.digit;
    let result = [];

    if(digit === ' '){
      return result;
    }
    else if(digit == -1){
      result.push(this.seg_g);
    } else {
      if(digit != 2) result.push(this.seg_c);
      if(digit != 1 && digit != 4) result.push(this.seg_a);
      if(digit != 5 && digit != 6) result.push(this.seg_b);
      if(digit != 1 && digit != 4 && digit != 7) result.push(this.seg_d);
      if(digit != 1 && digit != 2 && digit != 3) result.push(this.seg_f);
      if(digit != 0 && digit != 1 && digit != 7) result.push(this.seg_g);
      if(digit === 0 || digit == 2 || digit == 6 || digit == 8) result.push(this.seg_e);   
    }

    return result;
  }

  createSegmentContainer(){
    this.container = document.createElement('div');
    this.container.className = 'seven-segment';
    this.append(this.container);
  }

  connectedCallback(){
    this.innerHTML = ' ';
    // let digit = 0;
    this.digit = 0;  // digit == ' ' ? ' ' : parseInt(digit);

    this.createSegments();
    this.createSegmentContainer();
    
    this.container.append(...this.changeDisplay());
  }

  attributeChangedCallback(name, oldValue, newValue){
    if(name == 'digit'){
      this.digit = newValue == ' ' ? ' ' : parseInt(newValue);

      if(this.container){
        let oldSegments = this.container.querySelectorAll('div.segment');
        for(let i = 0; i < oldSegments.length; i++){
          oldSegments[i].remove();
        }
        this.container.append(...this.changeDisplay());
      }
    }
  }
}

customElements.define('seven-segment-digit', SevenSegmentDigit);