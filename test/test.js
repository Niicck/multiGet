'use strict'

const fs = require('fs')
const fse = require('fs-extra')
const chai = require('chai')
const Promise = require('bluebird')
const assert = chai.assert
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)

const multiGet = require('../multiGet')
const uri = 'http://31279842.bwtest-aws.pravala.com/384MB.jar'

const correctFile = fs.readFileSync(__dirname + '/correct-file')
const testFilename = 'test-file'
const testFilepath =  './' + testFilename

describe('multiGet', function(){
  this.timeout(0)

  before(function(){
    return fse.pathExists(testFilepath)
    .then((exists)=>{
      if (exists) {
        fs.unlinkSync(testFilepath)
      }
    })
  })

  afterEach(function(){
    return fs.unlinkSync(testFilepath)
  })

  it('should download file with default settings', function() {
    return multiGet(uri, testFilename)
    .then(() => {
      const testFile = fs.readFileSync(testFilepath)
      assert.equal(Buffer.compare(correctFile, testFile), 0)
    })
  })

  it('should download file with default settings in parallel', function() {
    // node index.js -o test-file http://31279842.bwtest-aws.pravala.com/384MB.jar
    return multiGet(uri, testFilename, true)
    .then(() => Promise.delay(1000)) // Parallel Implementation has slight delay
    .then(() => {
      const testFile = fs.readFileSync(testFilepath)
      assert.equal(Buffer.compare(correctFile, testFile), 0)
    })
  })

  it('should download file with non-default chunk-size', function() {
    // node index.js -o test-file -chunk-size 512638 http://31279842.bwtest-aws.pravala.com/384MB.jar
    return multiGet(uri, testFilename, null, null, 512638)
    .then(() => {
      const testFile = fs.readFileSync(testFilepath)
      assert.equal(Buffer.compare(correctFile, testFile), 0)
    })
  })

  it('should download file with non-default chunk-size in parallel', function() {
    // node index.js -o test-file -chunk-size 512638 -parallel http://31279842.bwtest-aws.pravala.com/384MB.jar
    return multiGet(uri, testFilename, true, null, 512638)
    .then(() => Promise.delay(1000)) // Parallel Implementation has slight delay
    .then(() => {
      const testFile = fs.readFileSync(testFilepath)
      assert.equal(Buffer.compare(correctFile, testFile), 0)
    })
  })

  it('should download file with non-default chunk-count', function() {
    // node index.js -o test-file -chunk-count 5 http://31279842.bwtest-aws.pravala.com/384MB.jar
    return multiGet(uri, testFilename, null, 5)
    .then(() => {
      const testFile = fs.readFileSync(testFilepath)
      assert.equal(Buffer.compare(correctFile, testFile), 0)
    })
  })

  it('should download file with non-default chunk-count in parallel', function() {
    // node index.js -o test-file -chunk-count 5 -parallel http://31279842.bwtest-aws.pravala.com/384MB.jar
    return multiGet(uri, testFilename, true, 5)
    .then(() => Promise.delay(1000)) // Parallel Implementation has slight delay
    .then(() => {
      const testFile = fs.readFileSync(testFilepath)
      assert.equal(Buffer.compare(correctFile, testFile), 0)
    })
  })

})
