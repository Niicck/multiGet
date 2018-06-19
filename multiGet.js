'use strict'

const request = require('request-promise')
const Promise = require('bluebird')
const _ = require('lodash')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const ProgressBar = require('progress');

const lengthLowerBound = 4000000
let chunkSize = 1000000
let totalSize = 4000000
let chunkCount = 4
let parallel = false

// Function to retrieve range of bytes from target file
const getChunk = (uri, startRange, endRange) => {
  return request({
    uri,
    method: "GET",
    headers: {
      Range: `bytes=${startRange}-${endRange}`
    }
  })
}

const test = (uri) => {
  let file
  const basename = path.basename(uri)
  const filename = __dirname + '/' + basename

  // Check for existence of file on host machine
  return fse.pathExists(filename)
  .then((exists)=>{
    if (exists) {
      return Promise.reject({message: `File ${basename} exists`})
    } else {
      file = fs.createWriteStream(filename)
    }
  })
  .then(() => {
    // Send HEAD request to determine length of target file
    return request({
      uri,
      method: "HEAD"
    })
  })
  .then((res) => {
    const length = res['content-length']
    if (length < lengthLowerBound) {
      // TODO: Adjust chunkSize accordingly
    }
    return
  })
  .then(() => {
    // Build Progress Bar
    console.log(`Downloading first ${chunkCount} chunks of '${uri}' to '${basename}'`)
    const bar = new ProgressBar(':bar:doneFlag', {
      complete: '.',
      incomplete: ' ',
      total: 4
    });

    if (!parallel) {
      // Retrieve file in chunks serially
      return Promise.mapSeries(_.range(chunkCount), (i) => {
        const startRange = i * chunkSize
        const endRange = (i + 1) * chunkSize - 1
        return getChunk(uri, startRange, endRange)
        .then((chunk) => {
          file.write(chunk)
          bar.tick({
            doneFlag: (i === chunkCount-1 ? "done" : "")
          })
          return Promise.resolve()
        })
      })
      .then(() => {
        file.end()
      })
    } else {
      // TODO: Retrieve file in chunks in parallel
      return Promise.resolve()
    }

  })
  .catch((err) => {
    console.log(`[ERROR] ${err.message}`)
  })
}

const testUrl = 'http://31279842.bwtest-aws.pravala.com/384MB.jar'
test(testUrl)
