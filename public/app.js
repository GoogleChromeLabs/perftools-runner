import * as render from './render.js';
import {runners} from './tools.mjs';

// Render main HTML before anything else.
const container = document.querySelector('#tools');
render.renderToolCards(Object.entries(runners), container);

loadLogos();

let selectedTools = [];
const tools = document.querySelectorAll('.tool-container');
const overlay = document.querySelector('.overlay');
const input = document.querySelector('#url');
const arrow = document.querySelector('.search-arrow');

/**
 * Fades in the tool screenshots one by one.
 * @return {!Promise} Resolves when the images are loaded.
 */
async function loadLogos() {
  const logos = Array.from(document.querySelectorAll('.tool .tool-logo'));
  return logos.map(logo => {
    return new Promise(resolve => {
      logo.addEventListener('load', e => {
        e.target.classList.add('loaded');
        resolve(e.target);
      }, {once: true});
    });
  });
}

/**
 * Hides the complete check icons for each tool.
 */
function resetCompletedChecks() {
  const checks = document.querySelectorAll('.tool-check');
  Array.from(checks).forEach(check => check.classList.remove('done'));
}

/**
 * Resets UI elements.
 */
function resetUI() {
  toggleInputOverlay(true);
  Array.from(tools).forEach(tool => tool.classList.remove('selected'));

  resetCompletedChecks();

  selectedTools = [];
}

/**
 * Toggles the input overlay.
 * @param {boolean=} clear When true, clears the input. Default is false.
 */
function toggleInputOverlay(clear = false) {
  overlay.classList.toggle('show');
  if (overlay.classList.contains('show')) {
    input.focus();
    render.renderToolRunCompleteIcons(selectedTools, document.querySelector('#tools-used'));
  }
  if (clear) {
    input.value = '';
  }
}

/**
 * Starts running the selected tools and streams results back as they come.
 * @param {!URL} url
 * @return {!Promise<string>} Resolves when all tool results are complete with
 *     the URL for the results PDF.
 */
function streamResults(url) {
  return new Promise((resolve, reject) => {
    const source = new EventSource(url.href);

    source.addEventListener('message', e => {
      try {
        const msg = JSON.parse(e.data.replace(/"(.*)"/, '$1'));
        const tool = runners[msg.tool];
        if (tool) {
          const check = document.querySelector(`.tool-check[data-tool="${msg.tool}"]`);
          check.classList.add('done');
        }
        if (msg.completed) {
          resetUI();
          source.close();
          resolve(msg.url);
        }
      } catch (err) {
        console.error('Malformed stream source msg', err);
        source.close();
        reject(err);
      }
    });

    // source.addEventListener('open', e => {
    //   // ga('send', 'event', 'Lighthouse', 'start run');
    // });

    source.addEventListener('error', e => {
      if (e.readyState === EventSource.CLOSED) {
        source.close();
        reject(e);
      }
    });
  });
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

  resetCompletedChecks();
  overlay.classList.add('running');
  arrow.classList.add('disabled');

  const runURL = new URL('/run', location);
  runURL.searchParams.set('url', url);
  runURL.searchParams.set('tools', selectedTools);

  const pdfURL = await streamResults(runURL);
  window.open(pdfURL);

  arrow.classList.remove('disabled');
  overlay.classList.remove('running');
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

document.addEventListener('dblclick', e => {
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
