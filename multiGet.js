'use strict';

const http = require('http');
const request = require('request');

const lengthLowerBound = 4000000
let chunkSize = 1000000

// Test Values
const testUrl = 'http://31279842.bwtest-aws.pravala.com/384MB.jar'



const test = (url) => {

  request.head(url)
  .on('response', (res) => {
    console.log(res.statusCode)
    const length = res.headers['content-length']
    if (length > lengthLowerBound) {
      // TODO: Adjust chunkSize accordingly
    }

    console.log(JSON.stringify(res.headers))


  })


}

test(testUrl)
