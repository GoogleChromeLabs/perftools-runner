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
const toolsUsed = document.querySelector('#tools-used');
const input = document.querySelector('#url');
const arrow = document.querySelector('.search-arrow');
const viewAction = document.querySelector('#report-link .view-action');
const shareAction = document.querySelector('#report-link .share-action');
const overlay = document.querySelector('.overlay');
const shareUrlInput = overlay.querySelector('input');
const copyReportURL = overlay.querySelector('.copy-action img');

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
 *
 * @param {!Array} tools Selected tools to run.
 * @param {!HTMLElement} toolsUsed Container to render into.
 */
function removeCompletedChecks(tools) {
  render.renderToolRunCompleteIcons(tools, toolsUsed);
  resetCompletedChecks();
}

/**
 * Resets UI elements.
 */
function resetUI() {
  Array.from(tools).forEach(tool => tool.classList.remove('selected'));
  selectedTools = [];
  arrow.classList.remove('disabled');
  document.body.classList.remove('running');
  input.value = null;
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
    }, 1000);

    source.addEventListener('message', e => {
      try {
        const msg = JSON.parse(e.data.replace(/"(.*)"/, '$1'));
        const tool = runners[msg.tool];
        if (tool) {
          const check = document.querySelector(`.tool-check[data-tool="${msg.tool}"]`);
          check.classList.add('done');
          render.renderToolReportLink({name: tool.name, report: msg.url}, check);
        }
        if (msg.completed) {
          clearInterval(interval);
          checks.forEach(check => check.classList.add('done'));
          source.close();
          resolve(msg);
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

  document.body.classList.remove('report'); // Remove report link when run starts.
  render.renderToolRunCompleteIcons([], toolsUsed);

  if (!url.length || !input.validity.valid) {
    alert('URL is not valid');
    return;
  } else if (!selectedTools.length) {
    alert('Please select a tool');
    return;
  }

  // Reset some UI elements.
  removeCompletedChecks(selectedTools);
  shareUrlInput.value = null;

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
    const {viewURL} = await streamResults(runURL);

    viewAction.href = viewURL;
    document.body.classList.add('report');
    document.body.classList.remove('running');

    gtag('event', 'complete', {event_category: 'tool'});
  } catch (err) {
    alert(`Error while streaming results:\n\n${err}`);
    removeCompletedChecks([]);
  }

  setTimeout(() => {
    resetUI();
  }, 500);
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

shareAction.addEventListener('click', async e => {
  e.preventDefault();

  if (!viewAction.href) {
    console.warn('Report not generated yet.');
    return;
  }

  // Don't re-upload PDF to GCS and re-shorten URL.
  if (!shareUrlInput.value) {
    const originalText = shareAction.textContent;
    shareAction.textContent = 'Sharing...';
    const {shortUrl} = await fetch(`/share?pdf=${viewAction.href}`).then(resp => resp.json());
    shareAction.textContent = originalText;
    shareUrlInput.value = shortUrl;

    document.querySelector('#qrcode').src = `https://chart.googleapis.com/chart?chs=425x425&cht=qr&chl=${shortUrl}&choe=UTF-8`;

    gtag('event', 'share', {event_category: 'report'});
  }

  overlay.classList.add('show');
});

copyReportURL.addEventListener('click', e => {
  navigator.clipboard.writeText(shareUrlInput.value).then(() => {
    console.log('URL copied to clipboard.');
    shareUrlInput.select();
    gtag('event', 'copy', {event_category: 'report'});
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
});

shareUrlInput.addEventListener('click', e => {
  e.target.select();
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

document.addEventListener('click', e => {
  if (overlay.classList.contains('show') && e.target === overlay) {
    overlay.classList.remove('show');
  }
});

document.addEventListener('keydown', e => {
  if (e.keyCode === 27 && !document.body.classList.contains('running')) { // ESC
    resetUI();
    overlay.classList.remove('show');
    return;
  }
});
