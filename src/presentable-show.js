import './presentable-slide.js';

class PresentableShow extends HTMLElement {
  constructor() {
    super();
    this.notesWindow = null;
    this.slides = [];
    this.slideIndex = 0;
    this.start = 0;
    this.volume = 1;
    this.volumeBg = 0.3;
  }

  connectedCallback() {
    this.start = Date.now();
    this.slides = Array.from(this.querySelectorAll('pres-slide'));
  }
}

window.customElements.define('pres-show', PresentableShow);
