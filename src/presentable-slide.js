import { PresentableCue } from './presentable-cue.js';
import { VisibleElementMixin } from './visible-element-mixin.js';

const html = String.raw;
const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      bottom: 0;
      contain: content;
      display: block;
      left: 0;
      opacity: 0;
      padding: 2vw 4vw;
      position: absolute;
      right: 0;
      top: 0;
      transition: all 400ms cubic-bezier(0.215, 0.61, 0.355, 1);
      visibility: hidden;
    }
    :host([show]) {
      opacity: 1;
      visibility: visible;
      z-index: 1000;
    }
    :host([hide]) {
      opacity: 0;
      visibility: hidden;
      z-index: initial;
    }
    :host-context(.notes) {
      display: none !important;
    }
  </style>
  <slot></slot>
  <slot name="cues"></slot>
`;

export class PresentableSlide extends VisibleElementMixin(HTMLElement) {
  constructor() {
    super();

    /** @type { Array<PresentableCue> } */
    this.cues = [];
    this.cueRange = [0, 0];

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
            }

            cue.stepIndex = stepIndex;
            this.cues.push(cue);
          }
        }
      },
      { once: true }
    );
  }

  connectedCallback() {
    this.parentElement.addEventListener('cue', this);
  }

  disconnectedCallback() {
    this.parentElement.removeEventListener('cue', this);
  }

  /**
   * Handle cue change event
   * @param { CustomEvent<{ cueIndex: number, oldCueIndex: number }> } event
   */
  handleEvent(event) {
    if (event.type === 'cue') {
      const { cueIndex, oldCueIndex } = event.detail;
      const hasOldCue = oldCueIndex >= this.cueRange[0] && oldCueIndex < this.cueRange[1];
      const hasCue = cueIndex >= this.cueRange[0] && cueIndex < this.cueRange[1];
      const isCurrentlyVisible = this.visible === 1;

      if (hasOldCue) {
        this.cues[oldCueIndex - this.cueRange[0]].active = false;
      }
      if (hasCue) {
        const cue = this.cues[cueIndex - this.cueRange[0]];
        this.setCueSteps(cue.stepIndex);
        cue.active = true;
      }

      this.visible = hasCue ? 1 : isCurrentlyVisible ? -1 : 0;
    }
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
      this.setAttribute(`step-${i}`, '');
    }
  }
}

window.customElements.define('pres-slide', PresentableSlide);
