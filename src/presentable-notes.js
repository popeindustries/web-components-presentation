class PresentableNotes extends HTMLElement {
  constructor() {
    super();
    this.steps = [];
  }

  connectedCallback() {}
}

window.customElements.define('pres-notes', PresentableNotes);
