'use strict'

const request = require('request-promise')
const Promise = require('bluebird')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')

const lengthLowerBound = 4000000
let chunkSize = 1000
let totalSize = 4000000
let chunkCount = 4
let parallel = false

// Function to retrieve range of bytes from target file
const getChunk = (uri, startRange, endRange) => {
  return request({
    uri,
    method: "GET",
    Range: `bytes=${startRange}-${endRange}`
  })
  .then((res) => {
    console.log("We got a chunk response")
    return res.body
  })
}

const test = (uri) => {
  const destination = __dirname + '/' + path.basename(uri)
  const file = fs.createWriteStream(destination) //TODO: check for existence [ERROR] File '384MB.jar' exists

  // Determine length of target file
  return request({
    uri,
    method: "HEAD"
  })
  .then((res) => {
    console.log(res)
    const length = res['content-length']
    if (length < lengthLowerBound) {
      console.log(`length is ${length}`)
      // TODO: Adjust chunkSize accordingly
    }
    console.log(`how long? ${length}`)
    return
  })
  .then(() => {
    if (!parallel) {
      // Retrieve file in chunks serially
      return Promise.mapSeries(_.range(chunkCount), (i) => {
        const startRange = i * chunkSize
        const endRange = (i + 1) * chunkSize - 1
        console.log("About to get a chunk")
        return getChunk(uri, startRange, endRange)
        .then((chunk) => {
          console.log("What is chunk?")
          console.log(chunk)
          file.write(chunk)
          console.log(`Wrote ${i+1} chunk!`)
          return Promise.resolve()
        })
      })
      .then(() => file.end())
    } else {
      // TODO: Retrieve file in chunks in parallel
      return Promise.resolve()
    }

  })
  .error((err) => {
    console.log("Problems!")
    console.log(err)
  })
  .finally(() => {
    file.end()
    return Promise.resolve()
  })
}

const testUrl = 'http://31279842.bwtest-aws.pravala.com/384MB.jar'
test(testUrl)
