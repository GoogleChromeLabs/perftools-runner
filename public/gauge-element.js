/* global Util */

import './lighthouse/lighthouse-core/report/html/renderer/util.js';

const tmpl = document.createElement('template');
tmpl.innerHTML = `
<style>
  :host {
    display: inline-block;
    --fail-color: hsl(1, 73%, 45%);
    --average-color: hsl(31, 100%, 45%); /* md orange 800 */
    --pass-color: hsl(139, 70%, 30%);
    --informative-color: #0c50c7;
    --body-line-height: 1;
    --circle-size: 125px;
    --circle-size-half: calc(var(--circle-size) / 2);
  }
  .lh-gauge__wrapper {
    --circle-background: hsl(216, 12%, 92%);
    --circle-border-width: 9;
    --inset-size: calc(var(--circle-size) - 2 * var(--circle-border-width));
    --transition-length: 1200ms;
  }
  .lh-gauge__wrapper--pass,
  .lh-gauge__wrapper--pass .lh-gauge {
    --circle-color: var(--pass-color);
    color: var(--circle-color);
  }
  .lh-gauge__wrapper--average,
  .lh-gauge__wrapper--average .lh-gauge {
    --circle-color: var(--average-color);
    color: var(--circle-color);
  }
  .lh-gauge__wrapper--fail,
  .lh-gauge__wrapper--fail .lh-gauge {
    --circle-color: var(--fail-color);
    color: var(--circle-color);
  }
  .lh-gauge {
    max-width: 360px;
    max-height: 360px;
    stroke-linecap: round;
    width: var(--circle-size);
    height: var(--circle-size);
  }
  .lh-gauge-base {
    fill: none;
    stroke: var(--circle-background);
    stroke-width: var(--circle-border-width);
  }
  .lh-gauge-arc {
    fill: none;
    stroke: var(--circle-color);
    stroke-width: var(--circle-border-width);
    animation: load-gauge var(--transition-length) ease forwards;
    animation-delay: 0;
  }
  @keyframes load-gauge {
    from { stroke-dasharray: 0 329; }
  }
  .lh-gauge__percentage {
    position: absolute;
    top: calc(var(--circle-size) / 3);
    font-weight: 300;
    font-size: calc(var(--circle-size) / 3);
    margin: 0;
    line-height: var(--body-line-height);
  }
  .lh-gauge__wrapper {
    display: inline-flex;
    align-items: center;
    flex-direction: column;
    text-decoration: none;
    flex: 1;
    min-width: auto;
    position: relative;
    /* Contain the layout style paint & layers during animation*/
    contain: content;
    will-change: opacity; /* Only using for layer promotion */
  }
  :host(.small) .lh-gauge__label {
    font-size: 12px;
    margin: 0;
  }
  .lh-gauge__label {
    margin: 14px 0 0 0;
    font-weight: 300;
    text-align: center;
    color: var(--material-blue-grey-600);
  }
</style>
<div class="lh-gauge__wrapper">
  <svg viewBox="0 0 120 120" class="lh-gauge" fill="none" stroke-width="2">
    <circle class="lh-gauge-base" r="53" cx="60" cy="60"></circle>
    <circle class="lh-gauge-arc" transform="rotate(-90 60 60)"
            stroke-dasharray="0 329" stroke-dashoffset="0" r="53" cx="60" cy="60"></circle>
  </svg>
  <h1 class="lh-gauge__percentage"></h1>
  <h2 class="lh-gauge__label"><slot></slot></h2>
</div>
`;

/* eslint-disable  require-jsdoc */
class GaugeElement extends HTMLElement {
  static get observedAttributes() {
    return ['score', 'label'];
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback() {
    this.wrapper = this.shadowRoot.querySelector('.lh-gauge__wrapper');
    // this.labelEl = this.shadowRoot.querySelector('.lh-gauge__label');
    this.gaugeEl = this.shadowRoot.querySelector('.lh-gauge__percentage');
    this.update(); // TODO: race condition here with score attr being ready via lit and this.score access in update()
  }

  get score() {
    return parseFloat(this.getAttribute('score'));
  }

  set score(val) {
    // Reflect the value of `score` as an attribute.
    this.setAttribute('score', val);
    this.update();
  }

  get label() {
    return this.textContent.trim();
  }

  set label(val) {
    // Reflect the value of `label` as an attribute.
    if (val) {
      this.textContent = val.trim();
    }
    this.update();
  }

  update() {
    // Wait a raf so lit-html rendering has time to setup attributes on custom element.
    requestAnimationFrame(() => {
      const score = Math.round(this.score * 100);
      this.gaugeEl.textContent = score;
      this.wrapper.className = 'lh-gauge__wrapper';
      // 329 is ~= 2 * Math.PI * gauge radius (53)
      // https://codepen.io/xgad/post/svg-radial-progress-meters
      const arc = this.shadowRoot.querySelector('.lh-gauge-arc');
      arc.style.strokeDasharray = `${this.score * 329} 329`;
      this.wrapper.classList.add(`lh-gauge__wrapper--${Util.calculateRating(this.score)}`);
    });
  }
}
/* eslint-enable  require-jsdoc */

customElements.define('gauge-element', GaugeElement);
