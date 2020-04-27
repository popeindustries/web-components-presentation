export class PresentableNote extends HTMLElement {
  constructor() {
    super();
    this.step = false;
  }

  connectedCallback() {
    this.step = this.hasAttribute('step');
  }
}

window.customElements.define('pres-note', PresentableNote);
