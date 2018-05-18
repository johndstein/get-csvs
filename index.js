#!/usr/bin/env node

'use strict';

const https = require('https');
const url = require('url');
const ss = require('stream-stream')({
  separator: '\n'
});
const byline = require('byline');
const {
  Transform
} = require('stream');

exports = module.exports = function requestCsvs(options, callback) {
  options = Object.assign({
    urls: [],
    https: {}
  }, options);
  const streams = {};
  for (const urlString of options.urls) {
    const u = url.parse(urlString);
    const httpsOpts = options.https;
    httpsOpts.method = 'GET';
    httpsOpts.path = u.pathname;
    httpsOpts.hostname = u.hostname;
    const req = https.request(httpsOpts, (res) => {
      if (res.statusCode !== 200) {
        return callback(new Error(
          'Bad status code: ' + res.statusCode + ' for url: ' + urlString));
      }
      streams[urlString] = res;
      if (Object.keys(streams).length === options.urls.length) {
        /*
          This monkey business is because we need to put the streams back in
          their original order. They will have been added to the streams object
          in an undetermined order.
        */
        options.urls.forEach(u => {
          ss.write(streams[u]);
        });
        ss.end();
        let result = byline(ss);
        if (Array.isArray(options.skipRows)) {
          result = result.pipe(new JunkFilter(
            options.skipRows
          ));
        }
        if (!options.noHeaders) {
          result = result.pipe(new HeaderFilter());
        }
        callback(null, result.pipe(addNewlines));
      }
    });
    req.on('error', (e) => {
      return callback(e);
    });
    req.end();
  }
};

class JunkFilter extends Transform {
  constructor(junk) {
    super();
    this.junk = junk || [];
  }
  _transform(chunk, encoding, callback) {
    let isJunk = false;
    for (let i = 0, l = this.junk.length; i < l && !isJunk; i++) {
      if (this.junk[i].test(chunk.toString())) {
        isJunk = true;
      }
    }
    if (isJunk) {
      callback();
    } else {
      callback(null, chunk);
    }
  }
}

class HeaderFilter extends Transform {
  constructor() {
    super();
  }
  _transform(chunk, encoding, callback) {
    if (chunk.toString().trim().length === 0) {
      callback();
    } else {
      if (this.header) {
        if (chunk.toString() === this.header) {
          return callback();
        }
      } else {
        this.header = chunk.toString();
      }
      callback(null, chunk);
    }
  }
}

const addNewlines = new Transform({
  transform(chunk, encoding, callback) {
    if (chunk.toString().trim().length > 0) {
      callback(null, chunk + '\n');
    } else {
      callback();
    }
  }
});