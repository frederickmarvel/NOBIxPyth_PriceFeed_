require('dotenv').config();

const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const INDODAX_API_KEY = process.env.INDODAX_API_KEY;
const INDODAX_SECRET = process.env.INDODAX_SECRET;
const CURRENCY_CONVERTER_API_KEY = process.env.CURRENCY_CONVERTER_API_KEY;


wss.on('connection', async (ws) => {
  const tokenPricesInUSD = await getTokenPricesInUSD();
  ws.send(JSON.stringify(tokenPricesInUSD));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

async function getTokenPricesInUSD() {
  const tokens = ['BTCIDR', 'ETHIDR', 'LTCIDR']; // Add more tokens as needed
  const [pricesInIDR, exchangeRate] = await Promise.all([
    getTokenPricesFromIndodax(tokens),
    getExchangeRateIDRtoUSD(),
  ]);

  return tokens.reduce((acc, token, index) => {
    acc[token] = pricesInIDR[index] * exchangeRate;
    return acc;
  }, {});
}

async function getTokenPricesFromIndodax(tokens) {
  const requests = tokens.map((token) =>
    axios.get(`https://indodax.com/api/ticker/${token}`, {
      headers: {
        'API-KEY': INDODAX_API_KEY,
        'API-SECRET': INDODAX_SECRET,
      },
    })
  );

  const responses = await Promise.all(requests);
  const pricesInIDR = responses.map((response) => response.data.ticker.last);

  // Log the fetched data from Indodax API
  console.log('Data fetched from Indodax API:', pricesInIDR);

  return pricesInIDR;
}

async function getExchangeRateIDRtoUSD() {
  const response = await axios.get(
    `https://openexchangerates.org/api/latest.json?app_id=${CURRENCY_CONVERTER_API_KEY}`
  );

  const IDRtoUSD = response.data.rates.USD / response.data.rates.IDR;
  return IDRtoUSD;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
