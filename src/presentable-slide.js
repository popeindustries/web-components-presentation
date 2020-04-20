import './presentable-notes.js';

class PresentableSlide extends HTMLElement {
  constructor() {
    super();
    this.media = [];
    this.notes = null;
  }

  connectedCallback() {
    this.media = Array.from(this.querySelectorAll('audio, video'));
    this.notes = this.querySelector('pres-notes');
  }
}

window.customElements.define('pres-slide', PresentableSlide);
