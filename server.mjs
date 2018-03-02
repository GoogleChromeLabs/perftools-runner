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
import express from 'express';
// import puppeteer from 'puppeteer';
// import {runners} from './public/tools.mjs';

const app = express();

// Async route handlers are wrapped with this to catch rejected promise errors.
// const catchAsyncErrors = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

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
app.use(express.static('node_modules'));
// app.use(function cors(req, res, next) {
//   res.set('Access-Control-Allow-Origin', '*');
//   // res.set('Content-Type', 'application/json;charset=utf-8');
//   // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
//   next();
// });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening on port ${PORT}. Press Ctrl+C to quit.`);
});

// // Make sure node server process stops if we get a terminating signal.
// function processTerminator(sig) {
//   if (typeof sig === 'string') {
//     process.exit(1);
//   }
//   console.log('%s: Node server stopped.', Date(Date.now()));
// }

// ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
// 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
// ].forEach(sig => {
//   process.once(sig, () => processTerminator(sig));
// });
