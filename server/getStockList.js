const request = require('request');
const iconv = require("iconv-lite");
const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');

const baseURL = "http://www.hexun.com";
const stockListURL = "http://so.hexun.com"
const stockNewsURL = "http://dfile.tool.hexun.com"
const newsURL = "http://roll.hexun.com/"

const getStockList = async (keyword) => {
    const browser = await puppeteer.launch({
        args:['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    // Skip Load Image
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('.png') ||
            interceptedRequest.url().endsWith('.jpg') ||
            interceptedRequest.url().endsWith('.css') ||
            interceptedRequest.url().endsWith('.jsp') ||
            (["script", "image"].indexOf(interceptedRequest.resourceType()) > - 1 && interceptedRequest.url().indexOf("type=all?math") === -1)) {
            interceptedRequest.abort();
        }
        else{
            console.log(interceptedRequest.url());
            interceptedRequest.continue();
        }

    });
    await page.goto(baseURL);
    // Get stock query request url
    const stockQueryURL = await page.evaluate(async ({stockListURL, keyword}) => {
        var scriptTag = document.createElement('script');
        scriptTag.src = `${stockListURL}/ajax.do?key=${keyword}&type=all?math=${Math.random()}`;
        return scriptTag.src;
    },{stockListURL, keyword})

    // query stock
    const stockResp = await page.goto(stockQueryURL);
    console.log(`go to page ${stockQueryURL}`);
    let responseText = await stockResp.text();
    responseText = responseText.replace(/\n/g, "");
    responseText = responseText.replace("hxSuggest_JsonData=", "{ \"data\":") + "}";
    const stockData = JSON.parse(responseText);

    await page.close();
    await browser.close();
    return stockData;
}

const getStockNews = async (stockCode) => {
    const browser = await puppeteer.launch({
        args:['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });
    const page = await browser.newPage();

    const newsURL = `${stockNewsURL}/homepage/StockData/js/${stockCode}.js?date=${(new Date()).valueOf()}`;
    const newsResp = await page.goto(newsURL);
    console.log(`Go to url:${newsURL}`)

    let newsText = await page.evaluate(async () => {
        return document.getElementsByTagName('pre')[0].innerText;
    })

    // Convert text to json
    var stockNews;
    const GetNews = (data) => {
        stockNews = data;
    }
    eval(newsText);

    const newsList = [];
    stockNews[0].corpnews.forEach((value) => {
        const dom = new JSDOM(value);
        const newskObjct = {
            title: dom.window.document.querySelector("a").title,
            url: dom.window.document.querySelector("a").href
        }
        newsList.push(newskObjct);
    })

    await page.close();
    await browser.close();
    return newsList ;
}

const getStockInfo  = async (stockCode) => {
    console.log(`Get sotck info for ${stockCode}`)
    const infoText = await new Promise((resolve, reject) => {
        request.get(`http://hq.sinajs.cn/list=sh${stockCode}`,{},async function(err,res,body){
            if(res.statusCode === 200 ) {
                eval(res.body);
                const stockDetailText = eval(`hq_str_sh${stockCode}`);
                resolve(stockDetailText);
            }

        });
    })
    const info = infoText.split(',');

    return { info };

}

const getNews = async () => {
    const browser = await puppeteer.launch({
        args:['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    // Skip Load Image
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('.png') ||
            interceptedRequest.url().endsWith('.jpg') ||
            interceptedRequest.url().endsWith('.css')) {
            interceptedRequest.abort();
        }
        else{
            interceptedRequest.continue();
        }

    });

    const newsResp = await page.goto(newsURL);
    let newsDom = await page.$('#immeList');
    console.log(`Go to url:${newsURL}`)

    // Format data
    const html = await newsDom.evaluate(newsDom => newsDom.innerHTML);
    const DOM = new JSDOM(html);
    const newsList = [];
    DOM.window.document.querySelectorAll('li > a').forEach((aDom) => {
        newsList.push({
            url: aDom.href,
            title: aDom.innerHTML
        });
    })

    await page.close();
    await browser.close();
    return newsList
}

const getIndex = async () => {
    console.log('getIndex from http://webstock.quote.hermes.hexun.com')
    const indexText = await new Promise((resolve, reject) => {
        request.get('http://webstock.quote.hermes.hexun.com/gb/a/quotelist?code=sse000001,szse399001,sse000011,szse399305,SSE000012,SSE000013&column=code,name,price,updownrate,priceweight&callback=getdata',{},async function(err,res,body){
            if(res.statusCode === 200 ) {
                let indexText;
                const getdata = (data) => { indexText = data }
                eval(res.body);
                resolve(indexText);
            }

        });
    })
    return indexText;
}


module.exports = {
    getStockList,
    getStockNews,
    getStockInfo,
    getNews,
    getIndex
};