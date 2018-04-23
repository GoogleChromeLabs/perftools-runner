/* global gtag */

import * as render from './render.js';
import {runners} from './tools.mjs';

// Render main HTML before anything else.
const primaryTools = Object.entries(runners).filter(t => t[1].primary);
render.renderToolCards(primaryTools, document.querySelector('#tools .toprow'));
const secondaryTools = Object.entries(runners).filter(t => !t[1].primary);
render.renderToolCards(secondaryTools, document.querySelector('#tools .bottomrow'));

loadLogos();

let selectedTools = [];
const tools = document.querySelectorAll('.tool-container');
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
  Array.from(checks).forEach(check => {
    check.classList.remove('done');
    check.dataset.runningTime = 0;
  });
}

/**
 * Resets UI elements.
 */
function resetUI() {
  Array.from(tools).forEach(tool => tool.classList.remove('selected'));
  resetCompletedChecks();
  selectedTools = [];
  arrow.classList.remove('disabled');
  document.body.classList.remove('running');
  input.value = '';
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

    // Start running timers for each tool.
    const checks = Array.from(document.querySelectorAll('.tool-check[data-tool]'));
    const interval = setInterval(() => {
      checks.forEach(check => {
        if (!check.classList.contains('done')) {
          check.dataset.runningTime = parseInt(check.dataset.runningTime || 0) + 1;
        }
      });
      // const allDone = checks.every(check => check.classList.contains('done'));
      // if (allDone) {
      //   clearInterval(interval);
      // }
    }, 1000);

    source.addEventListener('message', e => {
      try {
        const msg = JSON.parse(e.data.replace(/"(.*)"/, '$1'));
        const tool = runners[msg.tool];
        if (tool) {
          const check = document.querySelector(`.tool-check[data-tool="${msg.tool}"]`);
          check.classList.add('done');
        }
        if (msg.completed) {
          clearInterval(interval);
          checks.forEach(check => check.classList.add('done'));
          // Show completed check marks for a second before opening the results.
          setTimeout(() => {
            resetUI();
            source.close();
            resolve(msg.url);
          }, 500);
        }
        if (msg.errors) {
          throw new Error(msg.errors);
        }
      } catch (err) {
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

  render.renderToolRunCompleteIcons(selectedTools, document.querySelector('#tools-used'));

  resetCompletedChecks();
  document.body.classList.add('running');
  arrow.classList.add('disabled');

  const runURL = new URL('/run', location);
  runURL.searchParams.set('url', url);
  runURL.searchParams.set('tools', selectedTools);

  gtag('event', 'start', {event_category: 'tool'});
  selectedTools.forEach(tool => {
    gtag('event', 'run', {
      event_category: 'tool',
      event_label: tool,
      value: 1,
    });
  });

  try {
    const pdfURL = await streamResults(runURL);
    window.open(pdfURL);

    gtag('event', 'complete', {event_category: 'tool'});
  } catch (err) {
    alert(`Error while streaming results:\n\n${err}`);
  }

  resetUI();
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
  if (e.keyCode !== 13 || document.body.classList.contains('running')) {
    return;
  }
  await go(e.target.value);
});

arrow.addEventListener('click', async e => {
  e.stopPropagation();
  await go(input.value);
});

document.addEventListener('keydown', e => {
  if (e.keyCode === 27 && !document.body.classList.contains('running')) { // ESC
    resetUI();
    return;
  }
});
