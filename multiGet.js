'use strict';

const http = require('http');
const request = require('request-promise');

const lengthLowerBound = 4000000
let chunkSize = 1000000

// Test Values
const testUrl = 'http://31279842.bwtest-aws.pravala.com/384MB.jar'



const test = (uri) => {

  const options = {
    uri,
    method: "HEAD"
  }

  request(options)
  .then((res) => {
    console.log(res)
    const length = res['content-length']
    if (length < lengthLowerBound) {
      // TODO: Adjust chunkSize accordingly
    }

    console.log(`how long? ${length}`)
  })
  .then()


}

test(testUrl)
