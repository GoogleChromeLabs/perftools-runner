import {html, render} from '../lit-html/lit-html.js';
import {repeat} from '../lit-html/lib/repeat.js';
import {unsafeHTML} from '../lit-html/lib/unsafe-html.js';
import {runners} from './tools.mjs';

/**
 * @param {string} key
 * @param {string} tool
 */
function toolTemplate(key, tool) {
  return html`
    <a href="${tool.url}" class="tool-container" data-primary="${tool.primary}"
       data-tool="${key}" data-logo="${tool.logo}" tabindex="0" target="_blank">
      <div class="tool">
        <div class="tool-header">
          <span class="tool-name layout center-center">
            <span>${unsafeHTML(tool.name)}</span>
            <img src="/img/ic_open_in_new_black_24px.svg" class="external-link-icon">
          </span>
          <img src="/img/${key}-screenshot.png" class="tool-logo">
        </div>
        <div class="tool-summary">${tool.desc}</div>
      </div>
    </a>`;
}

/**
 * @param {!Array<!Object>} tools
 * @param {*} container
 */
function renderToolCards(tools, container) {
  const row = html`${
    repeat(tools, (item) => item[0], (item, i) => { // eslint-disable-line
      const [key, tool] = item;
      return toolTemplate(key, tool);
    })
  }`;

  render(row, container);
}

/**
 * @param {!Array<!Object>} tools
 * @param {*} container
 */
function renderToolRunCompleteIcons(tools, container) {
  const tmpl = html`${
    repeat(tools, (key) => key, (key, i) => { // eslint-disable-line
      const tool = runners[key];
      return html`<div class="tool-check" data-tool="${key}">${tool.name}</div>`;
    })
  }`;

  render(tmpl, container);
}

export {renderToolCards, renderToolRunCompleteIcons};
