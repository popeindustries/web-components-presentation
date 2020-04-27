import './presentable-note.js';

const html = String.raw;
const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      display: block;
      height: 100%;
      left: 0;
      opacity: 1;
      position: absolute;
      top: 0;
      visibility: hidden;
      width: 100%;
    }
    :host([active]) {
      visibility: visible;
    }
    :host(:not([active])) {
      visibility: hidden;
    }
  </style>
  <slot></slot>
  <slot name="notes"></slot>
  </div>
`;

class PresentableSlide extends HTMLElement {
  constructor() {
    super();

    this.notes = null;
    this.index = 0;

    this.attachShadow({ mode: 'open' }).appendChild(
      template.content.cloneNode(true)
    );
  }

  get active() {
    return this.getAttribute('active');
  }

  set active(active) {
    if (active) {
      this.style.zIndex = 100 - this.index;
      this.setAttribute('active', '');
    } else {
      this.style.zIndex = null;
      this.removeAttribute('active');
    }
  }

  connectedCallback() {
    this.notes = this.querySelector(
      '[slot="notes"]'
    )?.assignedSlot.assignedElements();
  }
}

window.customElements.define('pres-slide', PresentableSlide);
