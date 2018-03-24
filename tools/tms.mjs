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

import * as tools from '../public/tools.mjs';

const TOOL = tools.runners['TMS'];

/**
 * Run TestMySite tool using Puppeteer.
 * @param {!Browser}
 * @param {string} url
 * @return {!Promise<!{screenshot: buffer, html: string}>}
 */
async function run(browser, url) {
  const page = await browser.newPage();
  await page.setViewport(tools.DEFAULT_SCREENSHOT_VIEWPORT);

  // await page.setRequestInterception(true);
  // page.on('request', req => {
  //   if (req.url().includes('https://www.google.com/recaptcha/api.js')) {
  //     req.abort();
  //     return;
  //   }
  //   req.continue();
  // });

  await page.goto(TOOL.url);
  await page.waitForSelector(TOOL.urlInputSelector);

  const inputHandle = await page.$(TOOL.urlInputSelector);
  await inputHandle.type(url);
  await inputHandle.press('Enter'); // Run it!

  await page.waitForSelector('.results', {timeout: 60 * 1000});

  const obj = {
    tool: 'TMS',
    screenshot: await page.screenshot({fullPage: true}),
    html: await page.content(),
  };

  await page.close();

  return obj;
}

export {run};
