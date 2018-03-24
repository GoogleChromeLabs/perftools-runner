/* eslint-env browser */

import {html, render} from './lit-html/lit-html.js';
import {repeat} from './lit-html/lib/repeat.js';
import {unsafeHTML} from './lit-html/lib/unsafe-html.js';

import {runners} from './tools.mjs';

/**
 * @param {string} key
 */
function toolImage(key) {
  return html`<img src="img/${key}-screenshot.png" class="tool-logo">`;
}

/**
 * @param {!Array<string>} tool
 */
function renderResultScreenshots(tools) {
  return  html`${
    repeat(tools, (tool) => tool, (tool, i) => {
      return html`<img src="/${tool}.png" class="tool-result">`;
    })
  }`;
}

/**
 * @param {string} key
 * @param {string} tool
 */
function renderTool(key, tool) {
  return html`
    <div class="tool-container" data-tool="${key}" data-logo="${tool.logo}" tabindex="0">
      <div class="tool">
        <div class="tool-header">
          <span class="tool-name">${unsafeHTML(tool.name)}</span>
          ${toolImage(key)}
        </div>
        <div class="tool-summary">${tool.desc}</div>
      </div>
    </div>`;
}

/**
 * Resets UI elements.
 */
function resetUI() {
  toggleInputOverlay(true);
  Array.from(tools).forEach(tool => tool.classList.remove('selected'));
  selectedTools = [];
  render(renderResultScreenshots([]), screenshotContainer);
}

/**
 * @param {!Array<!Object>} tools
 */
function toolsTemplate(tools) {
  return html`${
    repeat(tools, (item) => item[0], (item, i) => {
      const [key, tool] = item;
      return renderTool(key, tool);
    })
  }`;
}

/**
 * Toogles the input overlay.
 * @param {boolean=} clear When true, clears the input. Default is false.
 */
function toggleInputOverlay(clear = false) {
  overlay.classList.toggle('show');
  if (overlay.classList.contains('show')) {
    input.focus();
  }
  if (clear) {
    input.value = '';
  }
}

/**
 * Runs the URL on the selected tools.
 * @param {string} url
 */
async function go(url) {
  url = url.trim();

  if (!url.match(/^https?:\/\//)) {
    url = `http://${url}`;
    input.value = url;
  }

  if (!url.length || !input.validity.valid) {
    alert('URL is not valid');
    return;
  } else if (!selectedTools.length) {
    alert('Please select a tool.');
    return;
  }

  const overlayStatus = document.querySelector('.overlay-status');
  overlay.classList.add('running');
  overlayStatus.textContent = 'Testing...';
  arrow.classList.add('disabled');

  const runURL = new URL('/run', location);
  runURL.searchParams.set('url', url);
  runURL.searchParams.set('tools', selectedTools);

  const tools = await fetch(runURL.href).then(resp => resp.json());
  render(renderResultScreenshots(tools), screenshotContainer);

  arrow.classList.remove('disabled');
  overlay.classList.remove('running');
  overlayStatus.textContent = '';
  input.value = '';
}

// Render main HTML before anything else.
const container = document.querySelector('#tools');
render(toolsTemplate(Object.entries(runners)), container);

let selectedTools = [];
const tools = document.querySelectorAll('.tool-container');
const screenshotContainer = document.querySelector('#screenshot-results');
const overlay = document.querySelector('.overlay');
const input = document.querySelector('#url');
const arrow = document.querySelector('.search-arrow');
const logos = Array.from(document.querySelectorAll('.tool .tool-logo'));

const loadPromises = logos.map(logo => {
  return new Promise(resolve => {
    logo.addEventListener('load', e => resolve(e.target), {once: true});
  });
});

Promise.all(loadPromises).then(logos => {
  logos.forEach(logo => logo.classList.add('loaded'));
});

Array.from(tools).forEach(tool => {
  tool.addEventListener('click', e => {
    e.stopPropagation();

    if (e.target.href) {
      return false;
    }

    const idx = selectedTools.findIndex(t => tool.dataset.tool === t);
    if (idx != -1) {
      selectedTools.splice(idx, 1);
      tool.classList.remove('selected');
    } else {
      selectedTools.push(tool.dataset.tool);
      tool.classList.add('selected');
    }
  });
});

input.addEventListener('keydown', async e => {
  if (e.keyCode !== 13) { // Enter
    return;
  }
  await go(e.target.value);
});

arrow.addEventListener('click', async e => {
  e.stopPropagation();
  await go(input.value);
});

document.addEventListener('click', e => {
  if (e.target !== input && overlay.contains(e.target) &&
      overlay.classList.contains('show') &&
      !overlay.classList.contains('running')) {
    resetUI();
  }
});

document.addEventListener('keydown', e => {
  if (e.keyCode === 27) { // ESC
    if (overlay.classList.contains('show') &&
        !overlay.classList.contains('running')) {
      resetUI();
    }
    return;
  }

  if (e.target === input) {
    return;
  }

  switch (e.keyCode) {
    case 32: // space
      if (selectedTools.length) {
        toggleInputOverlay();
      }
      break;
    case 37: // left arrow
      // TODO: move to previous tool
      break;
    // case 32: // space
    case 39: // right arrow
      // TODO: move to next tool
      break;
  }
});
