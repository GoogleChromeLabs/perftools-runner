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

import del from 'del';
import fs from 'fs';
import util from 'util';
import express from 'express';
import fetch from 'node-fetch';
import firebaseAdmin from 'firebase-admin';

import puppeteer from 'puppeteer';
import {runners, DEFAULT_SCREENSHOT_VIEWPORT} from './public/tools.mjs';
import * as bitly from './public/bitly.mjs';

/* eslint-disable no-unused-vars */
import * as LHTool from './tools/lighthouse.mjs';
import * as TMSTool from './tools/tms.mjs';
import * as WPTTool from './tools/wpt.mjs';
import * as PSITool from './tools/psi.mjs';

const CS_BUCKET = 'perf-sandbox.appspot.com';

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(
    JSON.parse(fs.readFileSync('./serviceAccount.json'))),
  storageBucket: CS_BUCKET,
});

const app = express();

// Async route handlers are wrapped with this to catch rejected promise errors.
const catchAsyncErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// eslint-disable-next-line require-jsdoc
function errorHandler(err, req, res, next) {
  console.error(err.message);
  // if (res.headersSent) {
  //   return next(err);
  // }
  res.write(`data: "${JSON.stringify({
    errors: `Error running your code. ${err}`,
  })}"\n\n`);

  res.status(500).end();//send({errors: `Error running your code. ${err}`});
}

/**
 * Creates an HTML page from the results and saves it to disk.
 * @param {!Array<{tool: string, screenshot: !Buffer}>} results
 * @return {string} HTML of page.
 */
function createHTML(results) {
  const body = results.map(r => {
    const tool = runners[r.tool];
    return `
      <h3 class="title">${tool.name} results</h3>
      <div class="desc">
        ${tool.desc}
        <span>Learn more: <a href="${tool.url}" target="_blank">${tool.url}</a></span>
      </div>
      <div class="screenshot">
        <img src="data:img/png;base64,${r.screenshot.toString('base64')}">
      </div>
    `;
  }).join('');

  const html = `
    <html>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Google+Sans:300,400">
        <style>
          :root {
            --orange: rgb(255, 108, 0);
            --purple: #4768FD;
            --yellow: #FCD230;
            --green: #31E7B6;
            --padding: 16px;
          }
          body {
            /*background: url(https://storage.googleapis.com/io-2018.appspot.com/v1/hashtag.gif) no-repeat 100% 100%;
            background-size: 25%;*/
            font-family: 'Google Sans', 'Product Sans', sans-serif;
            font-weight: 300;
            color: #202124;
            padding: 16px;
            margin: 0;
          }
          h1, h2, h3, h4 {
            font-weight: inherit;
            margin: 0;
          }
          h1 {
            color: var(--purple);
          }
          a {
            color: var(--purple);
            text-decoration: none;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: var(--padding);
            border-bottom: 4px solid var(--green);
          }
          header img {
            height: 50px;
          }
          header .date {
            margin-top: 4px;
            opacity: 0.6;
          }
          .title {
            color: var(--orange);
            margin-top: calc(var(--padding) * 2);
          }
          .desc {
            font-size: 12px;
            font-style: italic;
            margin-bottom: var(--padding);
            margin-top: 4px;
            opacity: 0.6;
          }
          .screenshot {
            /*page-break-after: always;*/
          }
          .screenshot img {
            max-width: 100%;
            max-height: 90%;
            border: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>Performance Tools Sandbox Report</h1>
            <h4 class="date">Google I/O 2018 &middot; ${(new Date()).toLocaleDateString()}</h4>
          </div>
          <div>
            <img src="https://storage.googleapis.com/io-2018.appspot.com/v1/hashtag.gif">
          </div>
        </header>
        ${body}
      </body>
    </html>
  `;

  return html;
}

/**
 * Compiles a PDF of the tool screenshot results.
 * @param {string} origin Origin of the server.
 * @param {!Browser} browser
 * @param {string} filename
 * @return {!Promise<{buffer: !Buffer, url: string, path: string}>} Created PDF metdata.
 */
async function createPDF(origin, browser, filename) {
  const page = await browser.newPage();
  await page.setViewport(DEFAULT_SCREENSHOT_VIEWPORT);
  await page.emulateMedia('screen');
  await page.goto(`${origin}/${filename}`, {waitUntil: 'load'});

  const pdfFilename = `${Date.now()}.${filename.replace('.html', '.pdf')}`;

  const path = `./tmp/${pdfFilename}`;
  const buffer = await page.pdf({
    path,
    margin: {top: '16px', right: '16px', bottom: '16px', left: '16px'},
  });

  await page.close();

  return {
    buffer,
    url: `${origin}/${pdfFilename}`,
    path,
    filename: pdfFilename,
  };
}

/**
 * Uploads the PDF to Firebase cloud storage.
 * @param {string} pdfURL URL of the PDF to upload to cloud storage.
 * @return {string} URL of the file in cloud storage.
 */
async function uploadPDF(pdfURL) {
  try {
    const bucket = firebaseAdmin.storage().bucket();
    // await file.makePublic();
    // const [metadata] = await file.getMetadata();
    // return metadata.mediaLink;
    const parts = pdfURL.split('/');
    const filename = parts[parts.length - 1];

    const [file, response] = await bucket.upload(pdfURL, {
      public: true,
      gzip: true,
      validation: false,
    });
    return `https://storage.googleapis.com/${CS_BUCKET}/${filename}`;
  } catch (err) {
    console.error('Error uploading PDF:', err);
  }

  return null;
}

// app.use(function forceSSL(req, res, next) {
//   const fromCron = req.get('X-Appengine-Cron');
//   if (!fromCron && req.hostname !== 'localhost' && req.get('X-Forwarded-Proto') === 'http') {
//     return res.redirect(`https://${req.hostname}${req.url}`);
//   }
//   next();
// });

app.use(function addRequestHelpers(req, res, next) {
  req.getCurrentUrl = () => `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  req.getOrigin = () => {
    let protocol = 'https';
    if (req.hostname === 'localhost') {
      protocol = 'http';
    }
    return `${protocol}://${req.get('host')}`;
  };
  next();
});

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
  const origin = req.getOrigin();
  let tools = req.query.tools ? req.query.tools.split(',') : [];
  const headless = req.query.headless === 'false' ? false : true;

  if (!tools.length) {
    throw new Error('Please provide a tool ?tools=[LH,PSI,WPT,TMS,SS].');
  }

  if (!url) {
    throw new Error('Please provide a URL.');
  }

  // Clear previous run screenshots.
  const paths = await del(['tmp/*']); // eslint-disable-line

  // Send headers for event-stream connection.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Forces GAE to keep connection open for event streaming.
  });

  // Check if URL exists before kicking off the tools.
  // Attempt to fetch the user's URL.
  try {
    await fetch(url);
  } catch (err) {
    throw err;
  }

  const browser = await puppeteer.launch({
    headless,
    // dumpio: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  // If on Mac, use DPR=2 so screenshots are gorgeous.
  DEFAULT_SCREENSHOT_VIEWPORT.deviceScaleFactor = process.platform === 'darwin' ? 2 : 1;

  try {
    tools = tools.filter(tool => Object.keys(runners).includes(tool));
    const toolsToRun = tools.map(tool => {
      console.info(`Started running ${tool}...`);

      return eval(`${tool}Tool`).run(browser, url).then(async results => {
        console.info(`Finished running ${tool}.`);

        await util.promisify(fs.writeFile)(`./tmp/${tool}.html`, results.html);

        const reportUrl = results.url || `/${tool}.html`;

        res.write(`data: "${JSON.stringify({tool, url: reportUrl})}"\n\n`);
        // res.flush();

        return results;
      });
    });

    console.info('Taking screenshots...');
    const results = await Promise.all(toolsToRun);
    for (const {tool, screenshot} of results) {
      await util.promisify(fs.writeFile)(`./tmp/${tool}.png`, screenshot);
    }
    console.info('Done.');

    // Save HTML page of results and create PDF from it using Puppeteer.
    console.info('Creating PDF...');
    await util.promisify(fs.writeFile)('./tmp/results.html', createHTML(results));
    const pdf = await createPDF(origin, browser, 'results.html');
    console.info('Done.');

    res.write(`data: "${JSON.stringify({
      completed: true,
      viewURL: pdf.url,
    })}"\n\n`);

    return res.status(200).end();
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }

  // res.status(200).send('Done');
}));


app.get('/share', catchAsyncErrors(async (req, res) => {
  const pdfURL = req.query.pdf;

  if (!pdfURL) {
    throw new Error('PDF url missing.');
  }

  console.info('Uploading PDF to Cloud Storage...');
  const gcsURL = await uploadPDF(pdfURL);
  console.info('Done.');

  console.info('Shortening URL...');
  const bitlyResp = await bitly.shorten(gcsURL);
  console.info('Done.');

  res.status(200).send({
    url: gcsURL,
    shortUrl: bitlyResp.url.replace('http:', 'https:'),
  });
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
