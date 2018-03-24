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

// import bodyParser from 'body-parser';
import del from 'del';
import fs from 'fs';
import util from 'util';
import express from 'express';
import puppeteer from 'puppeteer';
import * as LHTool from './tools/lighthouse.mjs';
import * as TMSTool from './tools/wpt.mjs';
import * as WPTTool from './tools/wpt.mjs';
import * as PSITool from './tools/psi.mjs';
import {runners} from './public/tools.mjs';
import fetch from 'node-fetch';

const app = express();

// Async route handlers are wrapped with this to catch rejected promise errors.
const catchAsyncErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// eslint-disable-next-line require-jsdoc
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send({errors: `Error running your code. ${err}`});
}

// app.use(function forceSSL(req, res, next) {
//   const fromCron = req.get('X-Appengine-Cron');
//   if (!fromCron && req.hostname !== 'localhost' && req.get('X-Forwarded-Proto') === 'http') {
//     return res.redirect(`https://${req.hostname}${req.url}`);
//   }
//   next();
// });

// app.use(function addRequestHelpers(req, res, next) {
//   req.getCurrentUrl = () => `${req.protocol}://${req.get('host')}${req.originalUrl}`;
//   req.getOrigin = () => {
//     let protocol = 'https';
//     if (req.hostname === 'localhost') {
//       protocol = 'http';
//     }
//     return `${protocol}://${req.get('host')}`;
//   };
//   next();
// });

// app.use(bodyParser.json());
app.use(express.static('public', {extensions: ['html', 'htm']}));
app.use(express.static('tmp'));
app.use(express.static('node_modules'));
// app.use(function cors(req, res, next) {
//   res.set('Access-Control-Allow-Origin', '*');
//   // res.set('Content-Type', 'application/json;charset=utf-8');
//   // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
//   next();
// });

app.get('/run', catchAsyncErrors(async (req, res) => {
  const url = req.query.url;
  let tools = req.query.tools ? req.query.tools.split(',') : [];
  const headless = req.query.headless === 'false' ? false : true;

  if (!tools.length) {
    throw new Error('Please provide a tool ?tools=[LH,PSI,WPT,TMS,SS].');
  }

  if (!url) {
    throw new Error('Please provide a URL.');
  }

  // Clear previous run screeshots.
  const paths = await del(['tmp/*']);

  // Check if URL exists before kicking off the tools.
  // Attempt to fetch the user's URL.
  try {
    await fetch(url);
  } catch (err) {
    throw err;
  }

  const browser = await puppeteer.launch({
    headless,
    //slowMo: 200
  });

  try {
    tools = tools.filter(tool => Object.keys(runners).includes(tool));
    const toolsToRun = tools.map(tool => eval(`${tool}Tool`).run(browser, url));

    console.info(`Starting new tool run with ${tools}...`);

    const results = await Promise.all(toolsToRun);
    for (const {tool, screenshot} of results) {
      await util.promisify(fs.writeFile)(`./tmp/${tool}.png`, screenshot);
    }
    // return res.type('image/png').send(screenshots);
    return res.status(200).send(tools);
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }

  // res.status(200).send('Done');
}));

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}. Press Ctrl+C to quit.`);
});

// Make sure node server process stops if we get a terminating signal.
/**
 * @param {string} sig Signal string.
 */
function processTerminator(sig) {
  if (typeof sig === 'string') {
    process.exit(1);
  }
  console.log('%s: Node server stopped.', Date(Date.now()));
}

[
  'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
  'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM',
].forEach(sig => {
  process.once(sig, () => processTerminator(sig));
});
