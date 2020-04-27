import { PresentableSlide } from './presentable-slide.js';

// const RE_MULTIPLE_SPACES = /\s\s+/g;
const TOUCH_THRESHOLD = 100;
// const VOLUME_CHANGE = 0.1;

const html = String.raw;
const isLocal = window.location.hostname === 'localhost';
const isShowtime = window.location.search.includes('showtime');
const startingSlide = isShowtime ? 0 : getUrlSlide();
const template = document.createElement('template');
let start = Date.now();

template.innerHTML = html`
  <style>
    :host {
      display: block;
      height: 56.25vw;
      left: 0;
      position: absolute;
      transform-origin: top left;
      top: 0;
      width: 100%;
    }
  </style>
  <slot></slot>
  </div>
`;

class PresentableShow extends HTMLElement {
  constructor() {
    super();

    /** @type { Array<PresentableSlide> } */
    this.slides = [];
    this.slideIndex = 0;

    this.attachShadow({ mode: 'open' }).appendChild(
      template.content.cloneNode(true)
    );

    this.shadowRoot.querySelector('slot')?.addEventListener(
      'slotchange',
      (event) => {
        for (const slottedChild of event.target.assignedElements()) {
          if (slottedChild instanceof PresentableSlide) {
            this.slides.push(slottedChild);
          }
        }
      },
      { once: true }
    );
  }

  connectedCallback() {
    document.addEventListener('keyup', this, false, { passive: true });
    document.documentElement.addEventListener('touchstart', this, false);
    if (isLocal) {
      window.addEventListener('popstate', this, false);
      window.history.replaceState({}, document.title, window.location.href);
    }

    // this.changeSlide(startingSlide);
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this, false);
    document.documentElement.removeEventListener('touchstart', this, false);
    window.removeEventListener('popstate', this, false);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'keyup':
        this.onKeyUp(event);
        break;
      case 'touchstart':
        this.onTouchStart(event);
        break;
      case 'popstate':
        if (event.state) {
          this.changeSlide(getUrlSlide());
        }
        break;
    }
  }

  /**
   * Display slide at 'slideIndex'
   * @param {number} slideIndex
   * @param {boolean} back
   */
  changeSlide(slideIndex, back) {
    const current = this.slides[this.slideIndex];
    const next = this.slides[slideIndex];

    current.active = false;
    next.active = true;

    this.slideIndex = slideIndex;
    if (isLocal) {
      window.history.pushState(
        {},
        '',
        window.location.href.replace(/\/\d*$/, `/${slideIndex}`)
      );
    }
  }

  forward() {
    if (this.slideIndex + 1 < this.slides.length) {
      this.changeSlide(this.slideIndex + 1);
    } else {
      return;
    }
  }

  back() {
    if (this.slideIndex - 1 >= 0) {
      this.changeSlide(this.slideIndex - 1, true);
    } else {
      return;
    }
  }

  /**
   * Handle key down
   * @param {Event} event
   */
  onKeyUp(event) {
    event.preventDefault();
    const key = (event.key || event.keyIdentifier).toLowerCase();

    if (
      key === 'arrowright' ||
      key === 'arrowup' ||
      key === 'right' ||
      key === 'up' ||
      key === 'pagedown'
    ) {
      this.forward();
    }
    if (
      key === 'arrowleft' ||
      key === 'arrowdown' ||
      key === 'left' ||
      key === 'down' ||
      key === 'pageup'
    ) {
      this.back();
    }
    if (key === 'r') {
      start = Date.now();
      // updateClock();
      this.changeSlide(0);
    }
  }

  /**
   * Handle touch
   * @param {Event} event
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
 * Get current slide index from url
 * @returns {number}
 */
function getUrlSlide() {
  const slide = window.location.pathname.split('/').slice(-1)[0];
  return parseInt(slide, 0) || 0;
}

window.customElements.define('pres-show', PresentableShow);
