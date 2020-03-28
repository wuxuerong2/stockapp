const express = require('express');
const cors = require('cors')
const requestHandler = require('./getStockList');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/test', async function(req, res) {
    res.send("ok");
})

app.post('/searchstock', async function(req, res) {
    const stockData = await requestHandler.getStockList(req.body.keyword);
    res.json(stockData);
})

app.post('/searchnews', async function(req, res) {
    const stockData = await requestHandler.getStockNews(req.body.stockCode);
    res.json(stockData);
})

app.post('/getinfo', async function(req, res) {
    const stockInfo = await requestHandler.getStockInfo(req.body.stockCode);
    res.json(stockInfo);
})

const server = app.listen(8081,function () {

    const host = server.address().address;
    const port = server.address().port;

    console.log(`Back-end server listening at http://${host}:${port}`);

});