import { PresentableCue } from './presentable-cue.js';
import { PresentableSlide } from './presentable-slide.js';

const TOUCH_THRESHOLD = 100;
const EVENT_SERVER = 'https://sheltered-anchorage-49892.herokuapp.com';

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
    this.notesWindow;
    this.es;

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
    this.addEventListener('active', this, false);

    if (!isNotes) {
      if (isLocal) {
        this.setAttribute('local', '');
        if (isShowtime) {
          this.setAttribute('showtime', '');
          this.notesWindow = window.open(window.location.href, 'notes');
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
      window.change = this.change.bind(this);
    }
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this, false);
    document.documentElement.removeEventListener('touchstart', this, false);
    window.removeEventListener('popstate', this, false);
    this.es?.close();
  }

  connectToEventServer() {
    this.es = new EventSource(EVENT_SERVER);
    this.es.onopen = () => {
      console.log('connected to remote event server');
    };
    this.es.onmessage = (event) => {
      const index = JSON.parse(event.data);
      console.log(`remote change to index: ${index}`);
      this.change(index);
    };
    this.es.onerror = (error) => {
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
  async change(cueIndex) {
    if (cueIndex < this.cueTotal && cueIndex >= 0) {
      this.dispatchEvent(
        new CustomEvent('cue', {
          composed: false,
          detail: { cueIndex, oldCueIndex: this.cueIndex },
        })
      );
      this.cueIndex = cueIndex;
      if (isLocal && !isShowtime) {
        window.history.pushState({}, '', window.location.href.replace(/\/\d*$/, `/${cueIndex}`));
      }
      if (isShowtime && !isNotes) {
        this.notesWindow?.change?.(cueIndex);
        try {
          await fetch(EVENT_SERVER, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: cueIndex,
          });
        } catch (err) {
          console.log('not connected to event server');
        }
      }
    } else if (cueIndex >= this.cueTotal) {
      try {
        await fetch(EVENT_SERVER, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: false,
        });
      } catch (err) {
        console.log('not connected to event server');
      }
    } else {
      // ignore invalid index
    }
  }

  forward() {
    this.change(this.cueIndex + 1);
  }

  back() {
    this.change(this.cueIndex - 1);
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
