'use strict'

const request = require('request-promise')
const Promise = require('bluebird')
const _ = require('lodash')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
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

examples:
  node multiGet.js http://31279842.bwtest-aws.pravala.com/384MB.jar
  node multiGet.js -o small-file http://31279842.bwtest-aws.pravala.com/384MB.jar
**/
const multiGet = () => {
  /******
  Downloads a single chunk from target uri
  @param chunkSize: size of chunk
  @param chunkNumber: index of current chunk
  ******/
  const getChunk = (chunkSize, chunkNumber) => {
    const startRange = chunkNumber * chunkSize
    const endRange = (chunkNumber + 1) * chunkSize - 1
    return request({
      uri,
      method: "GET",
      encoding: null, // required in order to process binary data
      headers: {
        Range: `bytes=${startRange}-${endRange}`
      }
    })
  }
  /******
  Writes chunk to target file
  @param file: writeStream to target file
  @param chunk: chunk being written to file
  @param chunkNumber: index of current chunk
  @param bar: progress bar instance
  ******/
  const writeChunk = (file, chunk, chunkNumber, bar) => {
    file.write(chunk)
    bar.tick({
      doneFlag: (chunkNumber === chunkCount-1 ? "done" : "")
    })
  }


  /******
  Initialize Variables
  ******/
  const uri = process.argv[process.argv.length - 1]
  let file, basename

  // Handle -o flag
  const outputFlagIndex = _.indexOf(process.argv, "-o")
  if (outputFlagIndex != -1) {
    basename = process.argv[outputFlagIndex + 1]
  } else {
    basename = path.basename(uri)
  }
  const outputFilename = __dirname + '/' + basename

  // Handle -parallel flag
  const parallel = (_.indexOf(process.argv, "-parallel") != -1)

  // TODO: make flags to alter these defaults
  const lengthLowerBound = 4000000
  let chunkSize = 1000000
  let totalDownloadSize = 4000000
  let chunkCount = 4

  /******
  Check for existence of file on host machine
  ******/
  return fse.pathExists(outputFilename)
  .then((exists)=>{
    if (exists) {
      return Promise.reject({message: `File ${basename} exists`})
    } else {
      file = fs.createWriteStream(outputFilename)
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
    if (length < lengthLowerBound) {
      // TODO: Adjust chunkSize accordingly
    }
    return
  })
  .then(() => {
    /******
    Build Progress Bar
    ******/
    console.log(`Downloading first ${chunkCount} chunks of '${uri}' to '${basename}'`)
    const bar = new ProgressBar(':bar:doneFlag', {
      complete: '.',
      incomplete: ' ',
      total: 4
    });

    if (!parallel) {
      /******
      Download file in chunks serially
      ******/
      return Promise.mapSeries(_.range(chunkCount), (chunkNumber) => {
        return getChunk(chunkSize, chunkNumber)
        .then((chunk) => writeChunk(file, chunk, chunkNumber, bar))
      })
      .then(() => file.end())
    } else {
      /******
      Retrieve file in chunks in parallel
      ******/
      return Promise.map(_.range(chunkCount), (chunkNumber) => {
        return getChunk(chunkSize, chunkNumber)
      }, {concurrency: 2}) // Could change concurrency value
      .then((chunks) => {
        return _.each(chunks, (chunk, chunkNumber) => {
          writeChunk(file, chunk, chunkNumber, bar)
        })
      })
      .then(() => file.end())
    }
  })
  .catch((err) => {
    console.log(`[ERROR] ${err.message}`)
  })
}

multiGet()
