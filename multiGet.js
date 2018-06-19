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
  node multiGet.js http://31279842.bwtest-aws.pravala.com/384MB.jar
  node multiGet.js -o my_file http://31279842.bwtest-aws.pravala.com/384MB.jar
  node multiGet.js -o my_file2 -chunk-size 512638 http://31279842.bwtest-aws.pravala.com/384MB.jar
  node multiGet.js -o my_file3 -chunk-count 5 http://31279842.bwtest-aws.pravala.com/384MB.jar
  node multiGet.js -o my_file4 -chunk-size 512638 -total-size 5000000 -parallel http://31279842.bwtest-aws.pravala.com/384MB.jar
**/
const multiGet = () => {
  /******
  Downloads a single chunk from target uri
  @param chunkSize: size of chunk
  @param chunkNumber: index of current chunk
  @param totalDownloadSize: total download size
  ******/
  const getChunk = (chunkSize, chunkNumber, totalDownloadSize) => {
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
  }
  /******
  Writes chunk to target file
  @param file: writeStream to target file
  @param chunk: chunk being written to file
  @param chunkNumber: index of current chunk
  @param bar: progress bar instance
  ******/
  const writeChunk = (file, chunk, chunkNumber, chunkCount, bar) => {
    file.write(chunk)
    bar.tick({
      doneFlag: (chunkNumber === chunkCount-1 ? "done" : "")
    })
  }

  /******
  Initialize Variables
  ******/
  const uri = process.argv[process.argv.length - 1]
  let file
  let basename = path.basename(uri)
  let chunkCount = 4
  let chunkSize = 1000000
  let totalDownloadSize = 4000000

  // Handle -o flag
  const outputFlagIndex = _.indexOf(process.argv, "-o")
  if (outputFlagIndex != -1) {
    basename = process.argv[outputFlagIndex + 1]
  }
  const outputFilename = __dirname + '/' + basename

  // Handle -parallel flag
  const parallel = (_.indexOf(process.argv, "-parallel") != -1)

  // Handle -total-size flag
  const totalSizeFlagIndex = _.indexOf(process.argv, "-total-size")
  if (totalSizeFlagIndex != -1) {
    totalDownloadSize = process.argv[totalSizeFlagIndex + 1]
  }

  // Handle -chunk-count and -chunk-size flags
  const chunkCountFlagIndex = _.indexOf(process.argv, "-chunk-count")
  if (chunkCountFlagIndex != -1) {
    chunkCount = process.argv[chunkCountFlagIndex + 1]
    chunkSize = Math.ceil(totalDownloadSize / chunkCount)
  } else {
    const chunkSizeFlagIndex = _.indexOf(process.argv, "-chunk-size")
    if (chunkSizeFlagIndex != -1) {
      chunkSize = process.argv[chunkSizeFlagIndex + 1]
      chunkCount = Math.ceil(totalDownloadSize / chunkSize)
    }
  }

  console.log(`chunkSize: ${chunkSize}`)
  console.log(`chunkCount: ${chunkCount}`)
  console.log(`totalDownloadSize: ${totalDownloadSize}`)

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
    if (length < totalDownloadSize) {
      chunkSize = Math.ceil(totalDownloadSize / chunkCount)
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
      total: Number(chunkCount)
    });

    if (!parallel) {
      /******
      Download file in chunks serially
      ******/
      return Promise.mapSeries(_.range(chunkCount), (chunkNumber) => {
        return getChunk(chunkSize, chunkNumber, totalDownloadSize)
        .then((chunk) => writeChunk(file, chunk, chunkNumber, chunkCount, bar))
      })
      .then(() => file.end())
    } else {
      /******
      Retrieve file in chunks in parallel
      ******/
      return Promise.map(_.range(chunkCount), (chunkNumber) => {
        return getChunk(chunkSize, chunkNumber, totalDownloadSize)
      }, {concurrency: 2}) // Could change concurrency value
      .then((chunks) => {
        return _.each(chunks, (chunk, chunkNumber) => {
          writeChunk(file, chunk, chunkNumber, chunkCount, bar)
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
