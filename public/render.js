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
       data-tool="${key}" data-logo="${tool.logo}" tabindex="0" target="tool">
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
 * @param {!HTMLElement} container
 */
function renderToolRunCompleteIcons(tools, container) {
  const tmpl = html`${
    repeat(tools, (key) => key, (key, i) => { // eslint-disable-line
      const tool = runners[key];
      return html`<div class="tool-check" data-tool="${key}">
        <a href="${tool.report || '#'}" target="report">${tool.name}</a>
      </div>`;
    })
  }`;

  render(tmpl, container);
}

/**
 * @param {!Object} tool
 * @param {!HTMLElement} container
 */
function renderToolReportLink(tool, container) {
  const tmpl = html`<a href="${tool.resultsUrl || '#'}" target="report" title="Open ${tool.name} results">${tool.name}</a>`;
  render(tmpl, container);
}

/**
 * @param {!Array<!Object>} categories
 */
function renderGauges(categories) {
  return html`${
    repeat(categories, null, (cat, i) => { // eslint-disable-line
      return html`<gauge-element score="${cat.score}">${cat.name}</gauge-element>`;
    })
  }`;
}

/**
 * @param {string} resultsUrl
 * @param {!Array<!Object>} categories
 * @param {!HTMLElement} container
 */
function renderLighthouseResultsRow(resultsUrl, lhr, container) {
  if (!resultsUrl || !resultsUrl.length) {
    render(html``, container);
    return;
  }

  const tool = runners['LH'];
  // <!--<h1 id="url">${lhr.url}</h1>-->
  const tmpl = html`
    <div class="results-row layout center-center">
      <div class="result-tool layout vertical center-center">
        <img src="${tool.logo}" class="logo">
        <h1>${tool.name} results</h1>
      </div>
      <a href="${resultsUrl}" target="_results" class="layout">
        ${renderGauges(Object.values(lhr.categories))}
      </a>
    </div>
  `;

  render(tmpl, container);
}

/**
 * @param {string} resultsUrl
 * @param {!HTMLElement} container
 */
function renderPSIResultsRow(resultsUrl, container) {
  if (!resultsUrl || !resultsUrl.length) {
    render(html``, container);
    return;
  }

  const tool = runners['PSI'];
  const tmpl = html`
    <div class="results-row layout center-center">
      <div class="result-tool layout vertical center-center">
        <img src="${tool.logo}" class="logo">
        <h1>${tool.name} results</h1>
      </div>
      <div class="layout">
        <a href="${resultsUrl}" target="_results" class="layout">
          <img src="/PSI.png" class="screenshot psi">
        </a>
      </div>
    </div>
  `;

  render(tmpl, container);
}

/**
 * @param {string} resultsUrl
 * @param {!HTMLElement} container
 */
function renderWPTResultsRow(resultsUrl, container) {
  if (!resultsUrl || !resultsUrl.length) {
    render(html``, container);
    return;
  }

  const tool = runners['WPT'];
  const tmpl = html`
    <div class="results-row layout center-center">
      <div class="result-tool layout vertical center-center">
        <img src="${tool.logo}" class="logo">
        <h1>${tool.name} results</h1>
      </div>
      <div class="layout">
        <a href="${resultsUrl}" target="_results" class="layout">
          <img src="/WPT.png" class="screenshot wpt">
        </a>
      </div>
    </div>
  `;

  render(tmpl, container);
}

export {
  renderToolCards,
  renderToolRunCompleteIcons,
  renderToolReportLink,
  renderLighthouseResultsRow,
  renderPSIResultsRow,
  renderWPTResultsRow,
};
