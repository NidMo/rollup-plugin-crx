import { defineComponent, html, reactive } from "utils/vue-lit"


const registryComponent = () => defineComponent('wb-parent', () => {
    const state = reactive({
      text: 'hello',
      show: true
    })
    const toggle = () => {
      state.show = !state.show
    }
    const onInput = (e: { target: { value: string } }) => {
      state.text = e.target.value
    }

    return () => html`
        <style>
            :host {
                width: 400px;
                height: 400px;
                z-index: 99999;
                background: #ffffff;
                border: 1px solid #333333;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translateX(-200px) translateY(-200px);
                display: flex;
                flex-flow: column nowrap;
                justify-items: center;
                align-items: center;
                border-radius: 4px;
                border: 2px solid #008BFF;
                padding: 10px;
            }
            .title {
                font-size: 16px;
                margin-bottom: 20px;
            }
        </style>
        <div class="title">lit-html + vue/reactivity </div>
      <button @click=${toggle}>toggle child</button>
      <p>
      <input value=${state.text} @input=${onInput}>
      </p>
      ${state.show ? html`<wb-child msg=${state.text}></wb-child>` : ``}
    `
  })

 

  export default registryComponent