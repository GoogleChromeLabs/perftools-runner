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

const TOOL = tools.runners['WPT'];
const WPT_API_KEY = 'A.04c7244ba25a5d6d717b0343a821aa59';
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
  wptUrl.searchParams.set('k', WPT_API_KEY);
  wptUrl.searchParams.set('f', 'json');
  if (pingback) {
    wptUrl.searchParams.set('pingback', pingback); // The pingback is passed an "id" parameter of the test.
  }
  // These emulation settings should match LH settings.
  wptUrl.searchParams.set('location', 'Dulles_Nexus5:Nexus 5 - Chrome Canary.3GFast');
  // wptUrl.searchParams.set('location', 'Dulles_Nexus5:Nexus 5 - Chrome Beta.3G_EM');
  // wptUrl.searchParams.set('mobile', 1); // Emulate mobile (for desktop cases).
  // wptUrl.searchParams.set('type', 'lighthouse'); // LH-only run.
  wptUrl.searchParams.set('lighthouse', 1);
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
  // const page = await browser.newPage();
  // await page.setViewport(tools.DEFAULT_SCREENSHOT_VIEWPORT);

  // await page.goto(TOOL.url);
  // await Promise.all([
  //   page.waitForSelector(TOOL.urlInputSelector),
  //   page.waitForSelector('#lighthouse'),
  // ]);

  // // Check Lighthouse checkbox so report is included.
  // await page.$eval('#lighthouse', checkbox => checkbox.checked = true);
  // const inputHandle = await page.$(TOOL.urlInputSelector);
  // await inputHandle.type(url);
  // await inputHandle.press('Enter'); // Run it!

  // await page.waitForSelector('#test_results-container', {timeout: 120 * 1000});

  const resultsUrl = await startOnWebpageTest(url);

  const page = await browser.newPage();
  await page.setViewport(tools.DEFAULT_SCREENSHOT_VIEWPORT);

  await page.goto(`${resultsUrl}1/details/`);

  const obj = {
    tool: 'WPT',
    screenshot: await page.screenshot({fullPage: true}),
    html: await page.content(),
  };

  await page.close();

  return obj;
}

export {run};
