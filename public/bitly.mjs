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

import fs from 'fs';
import url from 'url';
const {URL} = url;
import fetch from 'node-fetch';

const ENDPOINT = 'https://api-ssl.bitly.com';

let accessToken;
try {
  const json = JSON.parse(fs.readFileSync('./bitlyAccount.json'));
  accessToken = json.accessToken;
} catch (err) {
  console.error('Missing bitlyAccount.json containing an accessToken property.');
}

/**
 * Shortens a URL using bitly.
 * @param {string} url URL to shorten.
 * @return {string} Shortened URL.
 */
async function shorten(url) {
  if (!accessToken) {
    console.warn('No bit.ly access token available. Not shortening link.');
    return url;
  }

  const fetchUrl = new URL(`${ENDPOINT}/v3/shorten`);
  fetchUrl.searchParams.set('access_token', accessToken);
  fetchUrl.searchParams.set('longUrl', url);

  const resp = await fetch(fetchUrl.href);
  if (resp.status !== 200) {
    console.warn('Error from bit.ly API. Not shortening link.');
    console.info(resp);
    return url;
  }
  const json = await resp.json();
  return json.data;
}

export {shorten};
