import {html, render} from '../lit-html/lit-html.js';
import {repeat} from '../lit-html/lib/repeat.js';
import {unsafeHTML} from '../lit-html/lib/unsafe-html.js';

/**
 * @param {string} toolKey
 */
function toolImage(toolKey) {
  return html`<img src="img/${toolKey}-screenshot.png" class="tool-logo">`;
}

/**
 * @param {!Array<string>} tool
 */
function resultScreenshotTemplate(tools) {
  return html`${
    repeat(tools, (tool) => tool, (tool, i) => { // eslint-disable-line
      return html`<img src="/${tool}.png" class="tool-result">`;
    })
  }`;
}

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
            <img src="img/ic_open_in_new_black_24px.svg" class="external-link-icon">
          </span>
          ${toolImage(key)}
        </div>
        <div class="tool-summary">${tool.desc}</div>
      </div>
    </a>`;
}

/**
 * @param {!Array<!Object>} tools
 */
function toolsTemplate(tools) {
  return html`${
    repeat(tools, (item) => item[0], (item, i) => { // eslint-disable-line
      const [key, tool] = item;
      return toolTemplate(key, tool);
    })
  }`;
}

/**
 * @param {!Array<string>} selectedTools
 * @param {!HTMLElement} container Container to render markup into.
 */
function renderScreenshots(selectedTools, container) {
  render(resultScreenshotTemplate(selectedTools), container);
}

/**
 * @param {!Array<!Object>} tools
 * @param {*} container
 */
function renderToolCards(tools, container) {
  render(toolsTemplate(tools), container);
}

export {renderScreenshots, renderToolCards};
