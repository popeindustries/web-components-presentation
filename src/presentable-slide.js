import { ActiveElementMixin } from './active-element-mixin.js';
import { PresentableCue } from './presentable-cue.js';

const html = String.raw;
const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      contain: content;
      display: block;
      height: 100%;
      left: 0;
      opacity: 1;
      padding: 1.2vw;
      position: absolute;
      top: 0;
      transition: all 400ms cubic-bezier(0.215, 0.61, 0.355, 1);
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

    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

    // Parse cues when slotted
    this.shadowRoot.querySelector('slot[name="cues"]')?.addEventListener(
      'slotchange',
      (event) => {
        let stepIndex = 0;

        for (const slottedChild of event.target.assignedElements()) {
          if (slottedChild instanceof PresentableCue) {
            const cue = slottedChild;

            if (cue.isStep) {
              stepIndex++;
              cue.stepIndex = stepIndex;
            }

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
    const hasOldCue = oldCueIndex >= this.cueRange[0] && oldCueIndex < this.cueRange[1];
    const hasCue = cueIndex >= this.cueRange[0] && cueIndex < this.cueRange[1];

    if (hasOldCue) {
      this.cues[oldCueIndex - this.cueRange[0]].active = false;
    }
    if (hasCue) {
      const cue = this.cues[cueIndex - this.cueRange[0]];

      if (cue.isStep) {
        this.setCueSteps(cue.stepIndex);
      }

      cue.active = true;
    }
    this.active = hasCue;
  }

  /**
   * Set cue step attributes
   * @param { number } stepIndex
   */
  setCueSteps(stepIndex) {
    // Clear existing no longer needed
    for (const attr of this.getAttributeNames()) {
      if (attr.startsWith('step-')) {
        const index = attr.split('-')[1];
        if (index > stepIndex) {
          this.removeAttribute(attr);
        }
      }
    }

    // Add step-* attributes
    for (let i = 1; i <= stepIndex; i++) {
      this.setAttribute(`step-${i}`);
    }
  }
}

window.customElements.define('pres-slide', PresentableSlide);
