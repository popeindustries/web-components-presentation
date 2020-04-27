import "./presentable-note.js";

const html = String.raw;
const template = document.createElement("template");

template.innerHTML = html`
  <style>
    :host {
      height: 100%;
      left: 0;
      opacity: 1;
      position: absolute;
      top: 0;
      visibility: hidden;
      width: 100%;
    }
    :host(.show) {
      visibility: visible;
    }
    :host(.hide) {
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

    this.attachShadow({ mode: "open" }).appendChild(
      template.content.cloneNode(true)
    );
  }

  connectedCallback() {
    this.notes = this.querySelector(
      '[slot="notes"]'
    )?.assignedSlot.assignedElements();
  }
}

window.customElements.define("pres-slide", PresentableSlide);
