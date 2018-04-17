/**
 * @author Dmitriy Bizyaev
 */

const fs = require('fs');
const request = require('request-promise-native');
const express = require('express');
const ejs = require('ejs');

const url = 'https://2018.schors.spb.ru/d1_ipblock.json';
const totalAddresses = 3702258432;

const templateString = fs.readFileSync('index.ejs', { encoding : 'utf8' } );
const template = ejs.compile(templateString);

const cacheTime = 60 * 1000; // 1 min
let lastReq = 0;
let cached = 0;

const getBlockedIpsNum = async () => {
  const now = Date.now();

  if (now - lastReq <= cacheTime) {
    return cached;
  }

  try {
    const data = await request(url, { json: true });
    const num = data[data.length - 1].y;

    cached = num;
    lastReq = now;

    return num;
  } catch (err) {
    return cached;
  }
};

const calcPercent = n => n / totalAddresses * 100;

const app = express();

app.get('/', async (req, res) => {
  const numBlocked = await getBlockedIpsNum();
  const percentBlocked = calcPercent(numBlocked);

  const html = template({
    percentBlocked: Math.round(percentBlocked * 10000) / 10000
  });

  res.header('Content-Type', 'text/html').end(html);
});

app.listen(3000);
