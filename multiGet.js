'use strict'

const fs = require('fs')
const path = require('path')
const request = require('request-promise')
const Promise = require('bluebird')
const _ = require('lodash')
const fse = require('fs-extra')
const ProgressBar = require('progress');

/**
Downloads part of a file from a web server, in chunks.
Defaults to 4 chunks of 1MB each.
Usage: node ./multiGet.js [OPTIONS] url
Flags:
  -o string
    	Write output to <file> instead of default
  -parallel
    	Download chunks in parallel instead of sequentally
  -chunk-count integer
      Specify number of chunks. Default is 4
  -chunk-size integer
      Specify the size of each chunk. Default is 1MB
      If a chunk-count is already specified, then the -chunk-size flag will be ignored
      Note: this value will be recalculated if the actual target file size is less than the specified total size
  -total-size integer
      Specify the total download size. Default is 4MB

examples:
  node index.js http://31279842.bwtest-aws.pravala.com/384MB.jar
  node index.js -o my_file http://31279842.bwtest-aws.pravala.com/384MB.jar
  node index.js -o my_file2 -chunk-size 512638 http://31279842.bwtest-aws.pravala.com/384MB.jar
  node index.js -o my_file3 -chunk-count 5 http://31279842.bwtest-aws.pravala.com/384MB.jar
  node index.js -o my_file4 -chunk-size 712638 -total-size 5000000 -parallel http://31279842.bwtest-aws.pravala.com/384MB.jar
**/
const multiGet = (uri, outputFilename, parallel, chunkCount, chunkSize, totalDownloadSize) => {

  /******************************
  Initialize Variables
  ******************************/
  let file
  let chunksComplete = 0
  outputFilename = outputFilename || path.basename(uri)
  const outputFilepath = './' + outputFilename

  totalDownloadSize = totalDownloadSize || 4000000
  if (chunkCount) {
    chunkSize = Math.ceil(totalDownloadSize / chunkCount)
  } else if (chunkSize) {
    chunkCount = Math.ceil(totalDownloadSize / chunkSize)
  } else {
    chunkCount = 4
    chunkSize = Math.ceil(totalDownloadSize / chunkCount)
  }

  /*****************************
  Define Helper Functions
  ******************************/

  /*
  Downloads a single chunk from target uri and increments progress bar.
  @param chunkSize: size of chunk
  @param chunkNumber: index of current chunk
  @param totalDownloadSize: total download size
  */
  const getChunk = (chunkSize, chunkNumber, totalDownloadSize, bar) => {
    let startRange = chunkNumber * chunkSize
    let endRange = (chunkNumber + 1) * chunkSize - 1
    if (endRange >= totalDownloadSize) {
      endRange = totalDownloadSize - 1
    }
    return request({
      uri,
      method: "GET",
      encoding: null, // required in order to process binary data
      headers: {
        Range: `bytes=${startRange}-${endRange}`
      }
    })
    .then((chunk) => {
      chunksComplete++
      bar.tick({
        doneFlag: (chunksComplete === chunkCount ? "done" : "")
      })
      return chunk
    })
  }

  /*****************************
  Run Process
  ******************************/

  /******
  Check for existence of file on host machine
  ******/
  return fse.pathExists(outputFilepath)
  .then((exists)=>{
    if (exists) {
      return Promise.reject({message: `File ${outputFilename} exists`})
    } else {
      file = fs.createWriteStream(outputFilepath)
    }
  })
  .then(() => {
    /******
    Send HEAD request to determine length of target file
    ******/
    return request({
      uri,
      method: "HEAD"
    })
  })
  .then((res) => {
    const length = res['content-length']
    if (length < totalDownloadSize) {
      // If file size is smaller than totalDownloadSize, then make smaller chunks
      chunkSize = Math.ceil(length / chunkCount)
    }
    return
  })
  .then(() => {
    /******
    Build Progress Bar
    ******/
    console.log(`Downloading first ${chunkCount} chunks of '${uri}' to '${outputFilename}'`)
    const bar = new ProgressBar(':bar:doneFlag', {
      complete: '.',
      incomplete: ' ',
      total: chunkCount
    });

    if (!parallel) {
      /******
      Download file in chunks serially
      ******/
      return Promise.mapSeries(_.range(chunkCount), (chunkNumber) => {
        return getChunk(chunkSize, chunkNumber, totalDownloadSize, bar)
        .then((chunk) => file.write(chunk))
      })
      .then(() => file.end())
    } else {
      /******
      Retrieve file in chunks in parallel
      ******/
      return Promise.map(_.range(chunkCount), (chunkNumber) => {
        return getChunk(chunkSize, chunkNumber, totalDownloadSize, bar)
      }, {concurrency: 2}) // Could change concurrency value
      .then((chunks) => {
        _.each(chunks, (chunk) => {
          file.write(chunk)
        })
        file.end()
      })
    }
  })
  .catch((err) => {
    console.log(`[ERROR] ${err.message}`)
  })
}

module.exports = multiGet
