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

export const runners = {
  LH: {
    name: 'Lighthouse',
    url: 'https://lighthouse-ci.appspot.com/try',
    desc: `Personalized advice on how to improve the performance, accessibility,
          PWA, SEO, and other best practices of your site.`,
    logo: 'img/lighthouse-logo.png',
    urlInputSelector: '#url',
  },
  WPT: {
    name: 'WebPageTest',
    url: 'https://www.webpagetest.org/easy.php',
    desc: `Compare performance of one or more pages in a controlled
           lab environment, testing on real devices. Lighthouse is integrated
           into WebPageTest.`,
    urlInputSelector: '#url',
  },
  PSI: {
    name: 'PageSpeed Insights',
    desc: `Run to see field data for your site, alongside suggestions for
           common optimizations to improve it.`,
    url: 'https://developers.google.com/speed/pagespeed/insights/',
    urlInputSelector: 'input[name="url"]',
  },
  TMS: {
    name: 'Test My Site',
    url: 'https://testmysite.thinkwithgoogle.com/',
    desc: `Diagnose site performance across devices and learn about fixes for
           improving the experience. Combines WebPageTest and PageSpeed
           Insights.`,
    urlInputSelector: 'input[name="url-entry-input"]',
  },
  SS: {
    name: 'Speed Scorecard &amp;<br>Impact Calculator',
    desc: `Compare your mobile site speed & revenue opportunity against peers
           in over 10 countries using data from Chrome UX Report & Google Analytics.`,
    url: 'https://www.thinkwithgoogle.com/feature/mobile/',
  },
};

// export {runners};
