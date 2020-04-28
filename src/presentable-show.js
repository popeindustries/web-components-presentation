import { PresentableCue } from './presentable-cue.js';
import { PresentableSlide } from './presentable-slide.js';

const TOUCH_THRESHOLD = 100;

const html = String.raw;
const isLocal = window.location.hostname === 'localhost';
const isShowtime = window.location.search.includes('showtime');
const startingCue = isShowtime ? 0 : getUrlCue();
const template = document.createElement('template');

template.innerHTML = html`
  <style>
    *,
    *:after,
    *:before {
      box-sizing: border-box;
    }
    article,
    aside,
    details,
    figcaption,
    figure,
    footer,
    header,
    nav,
    section,
    summary {
      display: block;
    }
    audio,
    canvas,
    progress,
    video {
      display: inline-block;
      vertical-align: baseline;
    }
    audio:not([controls]) {
      display: none;
      height: 0;
    }
    a {
      background: transparent;
    }
    b,
    strong {
      font-weight: bold;
    }
    img {
      border: 0;
    }
    svg {
      overflow: visible;
    }

    :host {
      contain: content;
      display: block;
      height: 56.25vw;
      left: 0;
      position: absolute;
      transform-origin: top left;
      top: 0;
      width: 100%;
    }
    :host([local]) #cuenotes {
      display: block;
      font-size: 1.8vw;
      padding: 1em;
    }
    :host([showtime]) #cuenotes {
      font-size: 4vw;
      height: 100%;
      top: 0;
    }
    #cuenotes {
      background-color: white;
      bottom: 0;
      color: #0b1728;
      display: none;
      font-family: sans-serif;
      font-weight: 400;
      left: 0;
      position: absolute;
      right: 0;
      text-align: left;
      width: 100%;
      z-index: 999;
    }
  </style>
  <slot></slot>
  <div id="cuenotes"></div>
  </div>
`;

class PresentableShow extends HTMLElement {
  constructor() {
    super();

    this.cueIndex = -1;
    this.cueTotal = 0;

    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    this.elCueNotes = this.shadowRoot.querySelector('#cuenotes');

    // Parse slides when slotted
    this.shadowRoot.querySelector('slot')?.addEventListener(
      'slotchange',
      (event) => {
        for (const slottedChild of event.target.assignedElements()) {
          if (slottedChild instanceof PresentableSlide) {
            const slide = slottedChild;
            const cueRangeStart = this.cueTotal;

            for (const cue of slide.cues) {
              this.cueTotal++;
              cue.index = this.cueTotal;
            }

            slide.cueRange = [cueRangeStart, this.cueTotal];
          }
        }

        this.change(startingCue);
      },
      { once: true }
    );
  }

  connectedCallback() {
    if (isLocal) {
      this.setAttribute('local', '');
    }
    if (isShowtime) {
      this.setAttribute('showtime', '');
    }
    this.addEventListener('active', this, false);
    document.addEventListener('keyup', this, false, { passive: true });
    document.documentElement.addEventListener('touchstart', this, false);
    if (isLocal) {
      window.addEventListener('popstate', this, false);
      window.history.replaceState({}, document.title, window.location.href);
    }
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this, false);
    document.documentElement.removeEventListener('touchstart', this, false);
    window.removeEventListener('popstate', this, false);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'active': {
        if (event.target instanceof PresentableCue) {
          this.elCueNotes.innerHTML = event.target.innerHTML;
        }
        break;
      }
      case 'keyup': {
        this.onKeyUp(event);
        break;
      }
      case 'touchstart': {
        this.onTouchStart(event);
        break;
      }
      case 'popstate': {
        if (event.state) {
          this.change(getUrlCue());
        }
        break;
      }
    }
  }

  /**
   * Change to new "cueIndex"
   * @param { number } cueIndex
   */
  change(cueIndex) {
    if (cueIndex <= this.cueTotal) {
      this.dispatchEvent(
        new CustomEvent('cue', {
          composed: false,
          detail: { cueIndex, oldCueIndex: this.cueIndex },
        })
      );
      this.cueIndex = cueIndex;
      if (isLocal) {
        window.history.pushState({}, '', window.location.href.replace(/\/\d*$/, `/${cueIndex}`));
      }
    }
  }

  forward() {
    if (this.cueIndex + 1 <= this.cueTotal) {
      this.change(this.cueIndex + 1);
    }
  }

  back() {
    if (this.cueIndex - 1 >= 0) {
      this.change(this.cueIndex - 1);
    }
  }

  /**
   * Handle key down
   * @param { Event } event
   */
  onKeyUp(event) {
    event.preventDefault();
    const key = (event.key || event.keyIdentifier).toLowerCase();

    if (key === 'arrowright' || key === 'arrowup' || key === 'right' || key === 'up' || key === 'pagedown') {
      this.forward();
    }
    if (key === 'arrowleft' || key === 'arrowdown' || key === 'left' || key === 'down' || key === 'pageup') {
      this.back();
    }
    if (key === 'r') {
      this.change(0);
    }
  }

  /**
   * Handle touch
   * @param { Event } event
   */
  onTouchStart(event) {
    event.preventDefault();
    const start = event.layerX;
    let cb;

    document.documentElement.addEventListener(
      'touchend',
      (cb = function (evt) {
        document.documentElement.removeEventListener('touchend', cb, false);
        const diff = start - evt.layerX;

        if (Math.abs(diff) >= TOUCH_THRESHOLD) {
          diff > 0 ? this.forward() : this.back();
        }
      }),
      false
    );
  }
}

/**
 * Get current cue index from url
 * @returns { number }
 */
function getUrlCue() {
  const cue = window.location.pathname.split('/').slice(-1)[0];
  return parseInt(cue, 0) || 0;
}

window.customElements.define('pres-show', PresentableShow);
