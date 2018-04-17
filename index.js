/**
 * @author Dmitriy Bizyaev
 */

const fs = require('fs');
const path = require('path');
const argv = require('argv');
const request = require('request-promise-native');
const express = require('express');
const serveStatic = require('serve-static');
const ejs = require('ejs');
const formatNumber = require('format-number');

const url = 'https://2018.schors.spb.ru/d1_ipblock.json';
const totalAddresses = 3702258432;

const templateString = fs.readFileSync('index.ejs', { encoding : 'utf8' } );
const template = ejs.compile(templateString);

const pollInterval = 5 * 60 * 1000; // 5 min
const beforeRetry = 15 * 1000; // 15 sec
let numBlocked = 0;

const getBlockedIpsNum = async () => {
  const data = await request(url, { json: true });
  return data[data.length - 1].y;
};

const calcPercent = n => n / totalAddresses * 100;

const wait = msecs => new Promise(resolve => setTimeout(resolve, msecs));

const poll = async () => {
  while (true) {
    while (true) {
      try {
        console.log('Requesting data');
        numBlocked = await getBlockedIpsNum();
        console.log('Got data');
        break;
      } catch (err) {
        console.log('Failed to get data');
        await wait(beforeRetry);
      }
    }

    await wait(pollInterval);
  }
};

const app = express();

const formatPercent = formatNumber({ suffix: '%', decimal: ',', round: 4 });
const formatNum = formatNumber({ integerSeparator: '.' });

app.get('/', async (req, res) => {
  const html = template({
    numBlocked: formatNum(numBlocked),
    totalAddresses: formatNum(totalAddresses),
    percentBlocked: formatPercent(calcPercent(numBlocked)),
  });

  res.header('Content-Type', 'text/html').end(html);
});

app.get('/api/data', async (req, res) => {
  res.header('Content-Type', 'application/json').end(JSON.stringify({
    numBlocked: formatNum(numBlocked),
    totalAddresses: formatNum(totalAddresses),
    percentBlocked: formatPercent(calcPercent(numBlocked)),
  }));
});

app.use(serveStatic(path.join(__dirname, 'assets')));

const options = argv.option({
  name: 'port',
  short: 'p',
  type: 'int',
}).run().options;

poll();
app.listen(options.port || 3000);
