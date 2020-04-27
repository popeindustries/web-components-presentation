import "./presentable-slide.js";

const html = String.raw;
const template = document.createElement("template");

template.innerHTML = html`
  <style>
    :host {
    }
  </style>
  <slot></slot>
  </div>
`;

class PresentableShow extends HTMLElement {
  constructor() {
    super();
    this.notesWindow = null;
    this.slides = [];
    this.slideIndex = 0;
    this.start = 0;
    this.volume = 1;
    this.volumeBg = 0.3;

    this.attachShadow({ mode: "open" }).appendChild(
      template.content.cloneNode(true)
    );
  }

  connectedCallback() {
    this.start = Date.now();
    this.slides = Array.from(this.children);
  }
}

window.customElements.define("pres-show", PresentableShow);
