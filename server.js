'use strict';
const URL = require('url');
const http = require('http');
const server = new http.Server((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const query = require('querystring').parse(URL.parse(req.url).query);
  console.log(query);
  
  let url = req.url;
  if (url.indexOf('error') >= 0) {
    res.setHeader('Content-Type', 'text/html');
    res.write('请求错误');
  } else if (url.indexOf('jsonp') >= 0) {
    res.setHeader('Content-Type', 'text/javascript');
    res.write(query.callback + '('+ JSON.stringify({ name: 'da宗熊' }) +')');
  } else if (url.indexOf('json') >= 0) {
    res.setHeader('Content-Type', 'text/json');
    res.write(JSON.stringify({name: 'da宗熊'}));
  } else if (url.indexOf('html') >= 0) {
    res.setHeader('Content-Type', 'text/html');
    res.write('<div>test</div>');
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.write('未知请求');
  }
  res.end();
});

server.listen(3001);
