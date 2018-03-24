import * as render from './render.js';
import {runners} from './tools.mjs';

// Render main HTML before anything else.
const container = document.querySelector('#tools');
render.renderToolCards(Object.entries(runners), container);

loadLogos();

let selectedTools = [];
const tools = document.querySelectorAll('.tool-container');
const screenshotContainer = document.querySelector('#screenshot-results');
const overlay = document.querySelector('.overlay');
const overlayStatus = document.querySelector('.overlay-status');
const input = document.querySelector('#url');
const arrow = document.querySelector('.search-arrow');

/**
 * Fades in the tool screenshots.
 * @return {!Promise} Resolves when the images are loaded.
 */
async function loadLogos() {
  const logos = Array.from(document.querySelectorAll('.tool .tool-logo'));
  const loadPromises = logos.map(logo => {
    return new Promise(resolve => {
      logo.addEventListener('load', e => resolve(e.target), {once: true});
    });
  });

  return Promise.all(loadPromises).then(logos => {
    logos.forEach(logo => logo.classList.add('loaded'));
  });
}

/**
 * Resets UI elements.
 */
function resetUI() {
  toggleInputOverlay(true);
  Array.from(tools).forEach(tool => tool.classList.remove('selected'));
  selectedTools = [];
  render.renderScreenshots([], screenshotContainer);
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
 * Runs the URL in the selected tools.
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
    alert('Please select a tool');
    return;
  }

  overlay.classList.add('running');
  overlayStatus.textContent = 'Testing...';
  arrow.classList.add('disabled');

  const runURL = new URL('/run', location);
  runURL.searchParams.set('url', url);
  runURL.searchParams.set('tools', selectedTools);

  const tools = await fetch(runURL.href).then(resp => resp.json());
  render.renderScreenshots(tools, screenshotContainer);

  arrow.classList.remove('disabled');
  overlay.classList.remove('running');
  overlayStatus.textContent = '';
  input.value = '';
}

Array.from(tools).forEach(tool => {
  tool.addEventListener('click', e => {
    e.stopPropagation();

    if (tool.href && tool.dataset.primary === 'false') {
      return;
    }

    e.preventDefault();

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
      if (!selectedTools.length) {
        alert('Please select a tool');
        return;
      }
      toggleInputOverlay();
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
