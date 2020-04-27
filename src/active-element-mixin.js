/**
 * Mixin "active" attribute handling
 * @param { HTMLElement } baseClass
 */
export function ActiveElementMixin(baseClass) {
  return class ActiveElement extends baseClass {
    get active() {
      return this.getAttribute('active');
    }

    set active(value) {
      if (value) {
        this.setAttribute('active', '');
        this.dispatchEvent(
          new Event('active', { bubbles: true, cancelable: true })
        );
      } else {
        this.removeAttribute('active');
      }
    }
  };
}
