import {
  defineComponent,
  html,
  onMounted,
  onUnmounted,
  onUpdated,
  reactive,
} from "utils/vue-lit";

const registryComponent = () => defineComponent("wb-child", ["msg"], (props: { msg: string; }) => {
  const state = reactive({ count: 0 });
  const increase = () => {
    state.count++;
  };

  onMounted(() => {
    console.log("child mounted");
  });

  onUpdated(() => {
    console.log("child updated");
  });

  onUnmounted(() => {
    console.log("child unmounted");
  });

  return () => html`
    <style>
      :host {
        width: 200px;
        height: 200px;
        border: 1px solid #333333;
        display: flex;
        flex-flow: column nowrap;
        justify-items: center;
        align-items: center;
      }
    </style>
    <p>${props.msg}</p>
    <p>${state.count}</p>
    <button @click=${increase}>increase</button>
  `;
});


export default registryComponent