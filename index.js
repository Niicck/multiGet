'use strict'

const _ = require('lodash')

const multiGet = require('./multiGet')

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

const uri = process.argv[process.argv.length - 1]
let outputFilename
let chunkCount
let chunkSize
let totalDownloadSize

// Handle -o flag
const outputFlagIndex = _.indexOf(process.argv, "-o")
if (outputFlagIndex != -1) {
  outputFilename = process.argv[outputFlagIndex + 1]
}

// Handle -parallel flag
const parallel = (_.indexOf(process.argv, "-parallel") != -1)


// Handle -chunk-count flag
const chunkCountFlagIndex = _.indexOf(process.argv, "-chunk-count")
if (chunkCountFlagIndex != -1) {
  chunkCount = Number(process.argv[chunkCountFlagIndex + 1])
}

// Handle -chunk-size flag
const chunkSizeFlagIndex = _.indexOf(process.argv, "-chunk-size")
if (chunkSizeFlagIndex != -1) {
  chunkSize = Number(process.argv[chunkSizeFlagIndex + 1])
}

// Handle -total-size flag
const totalSizeFlagIndex = _.indexOf(process.argv, "-total-size")
if (totalSizeFlagIndex != -1) {
  totalDownloadSize = Number(process.argv[totalSizeFlagIndex + 1])
}

multiGet(uri, outputFilename, parallel, chunkCount, chunkSize, totalDownloadSize)
