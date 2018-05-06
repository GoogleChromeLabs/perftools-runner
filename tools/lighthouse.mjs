/**
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import lighthouse from 'lighthouse';
// import chromeLauncher from 'chrome-launcher';
import url from 'url';
const {URL} = url;
import * as tools from '../public/tools.mjs';

/**
 * Run Lighthouse.
 * @param {!Browser} browser Puppeteer browser instance.
 * @param {string} url
 * @return {!Promise<!{screenshot: buffer, html: string}>}
 */
async function run(browser, url) {
  const opts = {
    chromeFlags: ['--headless'],
    // logLevel: 'info',
    output: 'html',
    port: (new URL(browser.wsEndpoint())).port,
  };

  // const chrome = await chromeLauncher.launch({chromeFlags: opts.chromeFlags});
  // opts.port = chrome.port;

  const lhr = await lighthouse(url, opts, null);
  // await chrome.kill();

  const page = await browser.newPage();
  await page.setViewport(tools.DEFAULT_SCREENSHOT_VIEWPORT);
  await page.setContent(lhr.report);

  const obj = {
    tool: 'LH',
    screenshot: await page.screenshot({fullPage: true}),
    html: await page.content(),
    lhr: lhr.lhr,
  };

  await page.close();

  return obj;
}

export {run};
