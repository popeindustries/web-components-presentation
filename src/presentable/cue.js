const html = String.raw;
const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      display: none;
    }
  </style>
`;

export class PresentableCue extends HTMLElement {
  isStep = false;
  stepIndex = 0;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).appendChild(
      template.content.cloneNode(true),
    );
  }

  get active() {
    return this.getAttribute('active');
  }

  set active(value) {
    if (value) {
      this.setAttribute('active', '');
      this.dispatchEvent(
        new Event('active', { bubbles: true, cancelable: true }),
      );
    } else {
      this.removeAttribute('active');
    }
  }

  connectedCallback() {
    this.isStep = this.hasAttribute('step');
  }
}

window.customElements.define('pres-cue', PresentableCue);
