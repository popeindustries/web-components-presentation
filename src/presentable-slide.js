import { PresentableNote } from './presentable-note.js';

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

export class PresentableSlide extends HTMLElement {
  constructor() {
    super();

    /** @type { Array<PresentableNote> } */
    this.notes = [];
    this.progress = 0;

    this.attachShadow({ mode: 'open' }).appendChild(
      template.content.cloneNode(true)
    );

    this.shadowRoot.querySelector('slot[name="notes"]')?.addEventListener(
      'slotchange',
      (event) => {
        for (const slottedChild of event.target.assignedElements()) {
          if (slottedChild instanceof PresentableNote) {
            this.notes.push(slottedChild);
          }
        }
      },
      { once: true }
    );
  }

  connectedCallback() {}

  forward() {
    if (this.progress < 1) {
      this.progress += 1 / this.notes.length;
    }
  }

  back() {}
}

window.customElements.define('pres-slide', PresentableSlide);
