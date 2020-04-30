import { PresentableCue } from './presentable-cue.js';
import { PresentableSlide } from './presentable-slide.js';

const TOUCH_THRESHOLD = 100;
const EVENT_SERVER = 'https://pure-everglades-39129.herokuapp.com';

const html = String.raw;
const isLocal = window.location.hostname === 'localhost';
const isNotes = window.name === 'notes';
const isShowtime = isLocal && window.location.search.includes('showtime');
const isWatching = !isLocal || window.location.search.includes('watch');
const startingCue = isShowtime ? 0 : getUrlCue();
const template = document.createElement('template');

template.innerHTML = html`
  <style>
    *,
    *:after,
    *:before {
      box-sizing: border-box;
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
      font-size: 1.2vw;
      padding: 0.4em 1em;
    }
    :host([showtime]) #cuenotes {
      display: none;
    }
    :host-context(.notes) #cuenotes {
      align-items: center;
      display: flex;
      font-size: 3vw;
      height: 100%;
      padding: 5rem;
      top: 0;
    }
    #cuenotes {
      background-color: rgba(255,255,255,0.85);
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
      z-index: 9999;
    }
    #progress {
      background-color: var(--slide-progress-colour, hotpink);
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
      border-radius: calc(var(--slide-progress-height, 3px) / 2);
      height: var(--slide-progress-height, 3px);
      left: 0;
      max-width: 100%;
      position: absolute;
      transition: width ease-out 100ms;
      top: 0;
      z-index: 9998;
    }
  </style>
  <div id="progress"></div>
  <slot></slot>
  <div id="cuenotes"></div>
  </div>
`;

class PresentableShow extends HTMLElement {
  constructor() {
    super();

    this._cueIndex = -1;
    this._cueTotal = 0;
    this._notesWindow;
    this._es;

    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    this.elCueNotes = this.shadowRoot.querySelector('#cuenotes');
    this.elProgress = this.shadowRoot.querySelector('#progress');

    // Parse slides when slotted
    this.shadowRoot.querySelector('slot')?.addEventListener(
      'slotchange',
      (event) => {
        for (const slottedChild of event.target.assignedElements()) {
          if (slottedChild instanceof PresentableSlide) {
            const slide = slottedChild;
            const cueRangeStart = this._cueTotal;

            for (const cue of slide.cues) {
              this._cueTotal++;
              cue.index = this._cueTotal;
            }

            slide.cueRange = [cueRangeStart, this._cueTotal];
          }
        }

        this.index = startingCue;
      },
      { once: true }
    );
  }

  /**
   * Retrieve current cue index
   * @returns { number }
   */
  get index() {
    return this._cueIndex;
  }

  /**
   * Change current cue index to "value"
   * @param { number }
   */
  set index(value) {
    if (value < this._cueTotal && value >= 0) {
      this.dispatchEvent(
        new CustomEvent('cue', {
          composed: false,
          detail: { cueIndex: value, oldCueIndex: this._cueIndex },
        })
      );
      this._cueIndex = value;
      this.elProgress.style.width = `${(this._cueIndex / this._cueTotal) * 100}%`;

      if (isLocal && !isShowtime) {
        window.history.pushState({}, '', window.location.href.replace(/\/\d*$/, `/${value}`));
      }
      if (isShowtime && !isNotes) {
        this._notesWindow?.change?.(value);
        this._postToEventServer(value);
      }
    } else if (value >= this._cueTotal) {
      this._postToEventServer(false);
    } else {
      // ignore invalid index
    }
  }

  connectedCallback() {
    this.addEventListener('active', this, false);

    if (!isNotes) {
      if (isLocal) {
        this.setAttribute('local', '');
        if (isShowtime) {
          this.setAttribute('showtime', '');
          this._notesWindow = window.open(window.location.href, 'notes');
        }
        window.addEventListener('popstate', this, false);
        window.history.replaceState({}, document.title, window.location.href);
      }
      if (isWatching) {
        this.connectToEventServer();
      }
      document.addEventListener('keyup', this, false, { passive: true });
      document.documentElement.addEventListener('touchstart', this, false);
    } else {
      document.documentElement.classList.add('notes');
      window.change = (value) => (this.index = value);
    }
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this, false);
    document.documentElement.removeEventListener('touchstart', this, false);
    window.removeEventListener('popstate', this, false);
    this._es?.close();
  }

  connectToEventServer() {
    this._es = new EventSource(EVENT_SERVER);
    this._es.onopen = () => {
      console.log('connected to remote event server');
    };
    this._es.onmessage = (event) => {
      const index = JSON.parse(event.data);
      console.log(`remote change to index: ${index}`);
      this.change(index);
    };
    this._es.onerror = (error) => {
      console.log('error connecting to event server', error);
    };
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
        this._onKeyUp(event);
        break;
      }
      case 'touchstart': {
        this._onTouchStart(event);
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
   * Move cue index forward
   */
  forward() {
    this.index = this._cueIndex + 1;
  }

  /**
   * Move cue index backward
   */
  back() {
    this.index = this._cueIndex - 1;
  }

  /**
   * Handle key down
   * @param { Event } event
   */
  _onKeyUp(event) {
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
  _onTouchStart(event) {
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

  /**
   * Send current "index" to event server
   * @param { number | false } index
   */
  async _postToEventServer(index) {
    try {
      await fetch(EVENT_SERVER, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: index,
      });
    } catch (err) {
      console.log('not connected to event server');
    }
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
