import { ActiveElementMixin } from './active-element-mixin.js';
import { PresentableCue } from './presentable-cue.js';

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
  <slot name="cues"></slot>
`;

export class PresentableSlide extends ActiveElementMixin(HTMLElement) {
  constructor() {
    super();

    /** @type { Array<PresentableCue> } */
    this.cues = [];
    this.cueRange = [0, 0];
    this.onCue = this.onCue.bind(this);

    this.attachShadow({ mode: 'open' }).appendChild(
      template.content.cloneNode(true)
    );

    this.shadowRoot.querySelector('slot[name="cues"]')?.addEventListener(
      'slotchange',
      (event) => {
        for (const slottedChild of event.target.assignedElements()) {
          if (slottedChild instanceof PresentableCue) {
            const cue = slottedChild;
            this.cues.push(cue);
          }
        }
      },
      { once: true }
    );
  }

  connectedCallback() {
    this.parentElement.addEventListener('cue', this.onCue);
  }

  disconnectedCallback() {
    this.parentElement.removeEventListener('cue', this.onCue);
  }

  /**
   * Handle cue change event
   * @param { CustomEvent<{ cueIndex: number, oldCueIndex: number }> } event
   */
  onCue(event) {
    const { cueIndex, oldCueIndex } = event.detail;
    const hasOldCue =
      oldCueIndex >= this.cueRange[0] && oldCueIndex < this.cueRange[1];
    const hasCue = cueIndex >= this.cueRange[0] && cueIndex < this.cueRange[1];

    if (hasOldCue) {
      this.cues[oldCueIndex - this.cueRange[0]].active = false;
    }
    if (hasCue) {
      const cue = this.cues[cueIndex - this.cueRange[0]];
      cue.active = true;
      // TODO: set step value
    }
    this.active = hasCue;
  }
}

window.customElements.define('pres-slide', PresentableSlide);
