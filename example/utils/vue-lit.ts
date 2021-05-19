import { render } from "lit-html";
import { shallowReactive, effect } from "@vue/reactivity";
import "@webcomponents/custom-elements"

/**
 * 生命周期
 */
type Lifecycle = "_bm" | "_m" | "_bu" | "_u" | "_um";

let currentInstance: (HTMLElement & ComponentInstance) | null;

interface ComponentInstance {
  /**
   * beforeMount 生命周期
   */
  _bm: Function[];
  /**
   * mounted 生命周期
   */
  _m: Function[];
  /**
   * beforeUpdate 生命周期
   */
  _bu: Function[];
  /**
   * update 生命周期
   */
  _u: Function[];
  /**
   * unMounted 生命周期
   */
  _um: Function[];
}

export function defineComponent(name: string, factory: Function): void;
export function defineComponent(
  name: string,
  propDefs: string[],
  factory: Function
): void;
export function defineComponent(
  name: string,
  propDefs: Function | string[],
  factory?: Function
): void {
  if (typeof propDefs === "function") {
    factory = propDefs;
    propDefs = [];
  }

  customElements.define(
    name,
    class extends HTMLElement {
      private _props: Record<string, any> = {};
      /**
       * beforeMount 生命周期
       */
      _bm: Function[] = [];
      /**
       * mounted 生命周期
       */
      _m: Function[] = [];
      /**
       * beforeUpdate 生命周期
       */
      _bu: Function[] = [];
      /**
       * update 生命周期
       */
      _u: Function[] = [];
      /**
       * unMounted 生命周期
       */
      _um: Function[] = [];
      static get observedAttributes() {
        return propDefs;
      }
      constructor() {
        super();
        const props = (this._props = shallowReactive({}));
        currentInstance = this;
        const template = (factory as Function).call(this, props);
        currentInstance = null;
        // 执行 beforeMount 生命周期钩子函数
        this._bm && this._bm.forEach((cb) => cb());
        const root = this.attachShadow({ mode: "closed" });
        let isMounted = false;
        effect(() => {
          if (isMounted) {
            // 执行 beforeUpdate 生命周期钩子函数
            this._bu && this._bu.forEach((cb) => cb());
          }
          render(template(), root);
          if (isMounted) {
            // 执行 update 生命周期钩子函数
            this._u && this._u.forEach((cb) => cb());
          } else {
            isMounted = true;
          }
        });
      }
      connectedCallback() {
        // 执行 mounted 生命周期钩子函数
        this._m && this._m.forEach((cb) => cb());
      }
      disconnectedCallback() {
        // 执行 unMounted 生命周期钩子函数
        this._um && this._um.forEach((cb) => cb());
      }
      attributeChangedCallback(name: string, oldValue: any, newValue: any) {
        this._props[name] = newValue;
      }
    }
  );
}

/**
 * 创建生命周期函数
 * @param name
 * @returns
 */
function createLifecycleMethod(name: Lifecycle) {
  return (cb: Function) => {
    if (currentInstance) {
      (currentInstance[name] || (currentInstance[name] = [])).push(cb);
    }
  };
}

export const onBeforeMount = createLifecycleMethod("_bm");
export const onMounted = createLifecycleMethod("_m");
export const onBeforeUpdate = createLifecycleMethod("_bu");
export const onUpdated = createLifecycleMethod("_u");
export const onUnmounted = createLifecycleMethod("_um");
export { html } from "lit-html"
export { reactive } from "@vue/reactivity"
