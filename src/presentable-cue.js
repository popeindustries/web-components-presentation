import { ActiveElementMixin } from './active-element-mixin.js';

const html = String.raw;
const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      display: none;
    }
  </style>
`;

export class PresentableCue extends ActiveElementMixin(HTMLElement) {
  constructor() {
    super();

    this.isStep = false;
    this.stepIndex = 0;

    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.isStep = this.hasAttribute('step');
  }
}

window.customElements.define('pres-cue', PresentableCue);
