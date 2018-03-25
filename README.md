## Google Performance Tools Runner

Web frontend which allows users to simultaneously run several performance tools
(Lighthouse, PageSpeed Insights, Webpage Test) against a URL.
[Puppeteer](https://developers.google.com/web/tools/puppeteer/) is used
to take screenshots of the final result pages of the tools.

### Explainer

> Start the server with `npm start`.

The frontend (http://localhost:8080) UI displays a list of tools for the user
to select:

TODO: screenshot

Next, they hit the "Space" bar and Enter a URL to run on those sites:

TODO: screenshot

This fires off a request o the `/run` handler. This handler takes a `url` and
`tools` param. The latter is a "," separated list of tools to run. One
of LH, PSI, WPT.

The response is a JSON array of the tools that were run (e.g. `["LH", "PSI"]`).

**Examples**

Run Lighthouse and PSI against https://example.com:

http://localhost:8080/run?url=https://example.com/&tools=LH,PSI

Run Lighthouse against https://example.com using full chrome:

http://localhost:8080/run?url=https://example.com/&tools=LH&headless=false

### Installation & Setup

Check the repo and run `npm i`. You'll need Node 8+ support for ES modules to work.

### Development

Start the server in the project root:

```
npm start
```

Lint:

```
npm run lint
```
