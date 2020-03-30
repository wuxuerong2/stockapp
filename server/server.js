const express = require('express');
const cors = require('cors')
const requestHandler = require('./getStockList');
const bodyParser = require("body-parser");
const ws = require('nodejs-websocket');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/test', async function(req, res) {
    res.send("ok");
})

app.get('/getnews', async function(req, res) {
    res.send("ok");
})

app.get('/getindex', async function(req, res) {
    const stockData = await requestHandler.getIndex();
    res.json(stockData);
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

/****************************************************************************************/

const websockServer = ws.createServer((conn) =>{
    conn.on("error",function(err){
        // 出错触发 //
        console.log("header err")
        console.log(err)
    })
}).listen(8083);

setInterval(() => {
    websockServer.connections.forEach((conn, index) => {
        const indexInfo = {
            index1: Math.floor((Math.random()*3)+1) + Math.floor((Math.random()*3)+1)/10 + Math.floor((Math.random()*3)+1)/100,
            index2: Math.floor((Math.random()*10)+1) + Math.floor((Math.random()*10)+1)/10 + Math.floor((Math.random()*10)+1)/100,
            index3: Math.floor((Math.random()*10)+1) + Math.floor((Math.random()*10)+1)/10 + Math.floor((Math.random()*10)+1)/100,
        }
        try {
            conn.sendText(JSON.stringify(indexInfo));
        } catch (e) {
            console.log('websocket send error');
            console.log(index);
        }
    })
}, 30000);