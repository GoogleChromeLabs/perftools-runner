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


/**
 * Creates a link with report results.
 * @param {string} url URL to the result.
 * @return {string} A link to the results.
*/
export const getResultsLink = (url) => (`
      <p class="reportlink">
        Results available at: <a href="${url}" target="_blank">${url}</a>
      </p>`
);

/**
 * Creates a html template with meta-data.
 * @param {string} name Name of the  test.
 * @param {string} desc Description of the test.
 * @param {string} url Link to the tool.
 * @param {string} resultsLink Link to the result.
 * @param {string} screenshot Screenshot and result of the test.
 * @return {string} A html template with meta-data.
 */
export const createHTMLTemplate = ({name, desc, url}, resultsLink, screenshot) => (
  `<h3 class="title">${name} results</h3>
      <div>
        <div class="desc">
          About this tool: ${desc}
          Learn more at <a href="${url}" target="_blank">${url}</a>
        </div>
        ${resultsLink}
      </div>
      <div class="screenshot">
        <img src="data:img/png;base64,${screenshot.toString('base64')}">
      </div>`
);

/**
 * Creates the html page based on yielded results.
 * @param {string} content Body content and results to be injected.
 * @return {string} Created html page.
 */
export const createHTMLPage = (content) => (
  `<html>
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
          .reportlink, .desc {
            font-size: 14px;
            opacity: 0.6;
          }
          .reportlink {
            font-style: italic;
          }
          .desc {
            margin-bottom: var(--padding);
            margin-top: 4px;
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
        ${content}
      </body>
    </html>`
);
