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
    res.statusCode = 500;
    res.write('request error');

  } else if (url.indexOf('json-err') >= 0) {
    res.setHeader('Content-Type', 'text/javascript');
    res.write('-|' + JSON.stringify({name: 'da宗熊'}) + '|-');

  } else if (url.indexOf('jsonp') >= 0) {
    res.setHeader('Content-Type', 'text/javascript');
    res.write(query.callback + '('+ JSON.stringify({ name: 'da宗熊' }) +')');

  } else if (url.indexOf('json') >= 0) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({name: 'da宗熊'}));

  } else if (url.indexOf('html') >= 0) {
    res.setHeader('Content-Type', 'text/html');
    res.write('<div>test</div>');

  } else if (url.indexOf('timeout') >= 0) {
    setTimeout(function() {
      res.end('timeout');
    }, 3000);
    return;

  } else if (url.indexOf('submit') >= 0) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(query));
    
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.write('ok');
  }
  res.end();
});

server.listen(3001);
