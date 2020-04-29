/**
 * Mixin "show/hide" attribute handling
 * @param { HTMLElement } baseClass
 */
export function VisibleElementMixin(baseClass) {
  return class VisibleElement extends baseClass {
    constructor() {
      super();
      this._visible = 0;
    }

    get visible() {
      return this._visible;
    }

    /**
     * Set visibility.
     * @param { 0|1|-1 } value - default|show|hide
     */
    set visible(value) {
      this._visible = value;

      let shouldDispatch = false;

      switch (value) {
        case 0:
          this.removeAttribute('show');
          this.removeAttribute('hide');
          break;
        case 1:
          this.removeAttribute('hide');
          this.setAttribute('show', '');
          shouldDispatch = true;
          break;
        case -1:
          this.removeAttribute('show');
          this.setAttribute('hide', '');
          shouldDispatch = true;
          break;
      }
      if (shouldDispatch) {
        this.dispatchEvent(new CustomEvent('visible', { bubbles: true, cancelable: true, detail: this._visible }));
      }
    }
  };
}
