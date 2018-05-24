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

import url from 'url';
const {URL} = url;
import fetch from 'node-fetch';
import * as tools from '../public/tools.mjs';

const API_KEY = '7dce091be3b64d95b7812bb5211ad5a9';//'A.04c7244ba25a5d6d717b0343a821aa59';
// const TOOL = tools.runners['WPT'];
// const WPT_PR_MAP = new Map();

/**
* Uses WebPageTest's Rest API to run Lighthouse and score a URL.
* See https://sites.google.com/a/webpagetest.org/docs/advanced-features/webpagetest-restful-apis
* @param {!string} testUrl URL to audit.
* @param {!string=} pingback Optional URL for WPT to ping when result is ready.
*     If not provided, WPT redirects to the results page when done.
* @return {!Promise} json response from starting a WPT run.
*/
async function startOnWebpageTest(testUrl, pingback = null) {
  const wptUrl = new URL('https://www.webpagetest.org/runtest.php');
  wptUrl.searchParams.set('k', API_KEY);
  wptUrl.searchParams.set('f', 'json');
  if (pingback) {
    // The test id is passed back with the pingback URL as a "id" query param.
    wptUrl.searchParams.set('pingback', pingback);
  }
  // These emulation settings should match LH settings.
  // wptUrl.searchParams.set('location', 'Dulles_Nexus5:Nexus 5 - Chrome Canary.3GFast');
  wptUrl.searchParams.set('location', 'Dulles_MotoG4:MotoG4 - Chrome.3GFast');
  // wptUrl.searchParams.set('mobile', 1); // Emulate mobile (for desktop cases).
  // wptUrl.searchParams.set('type', 'lighthouse'); // LH-only run.

  wptUrl.searchParams.set('fvonly', 1); // skips the repeat view and will cut the run time in half
  // wptUrl.searchParams.set('video', 1); // include video filmstrips which are one of the most important features
  // wptUrl.searchParams.set('timeline', 1); // include main-thread activity and js execution info in the waterfalls
  wptUrl.searchParams.set('priority', 0); // top priority, head of queue.
  wptUrl.searchParams.set('runs', 1); // number of tests to run.

  // wptUrl.searchParams.set('lighthouse', 1); // include LH results.
  wptUrl.searchParams.set('url', testUrl);

  try {
    const json = await fetch(wptUrl.href).then(resp => resp.json());

    const userUrl = json.data.userUrl;
    console.info('Started WPT run:', userUrl);

    const waitForRunToFinish = async function(statusUrl) {
      return new Promise(async resolve => {
        const interval = setInterval(async () => {
          const json = await fetch(statusUrl).then(resp => resp.json());
          console.info(json.statusText);
          if (json.statusCode === 200) {
            clearInterval(interval);
            return resolve(userUrl);
          }
        }, 10 * 1000); // poll every 10 seconds.
      });
    };

    const checkStatusUrl = new URL('https://www.webpagetest.org/testStatus.php');
    checkStatusUrl.searchParams.set('test', json.data.testId);

    return waitForRunToFinish(checkStatusUrl.href);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * Run WebpageTest tool using Puppeteer.
 * @param {!Browser}
 * @param {string} url
 * @return {!Promise<!{screenshot: buffer, html: string}>}
 */
async function run(browser, url) {
  const resultsUrl = await startOnWebpageTest(url);

  const page = await browser.newPage();
  await page.setViewport(tools.DEFAULT_SCREENSHOT_VIEWPORT);
  await page.goto(`${resultsUrl}1/details/`);

  const main = await page.$('#main');
  const screenshot = await main.screenshot();
  // const screenshot = await page.screenshot({fullPage: true});

  const obj = {
    tool: 'WPT',
    screenshot,
    html: await page.content(),
    resultsUrl,
  };

  await page.close();

  return obj;
}

export {run};
