## multiGet

Downloads part of a file from a web server, in chunks.<br>
Defaults to 4 chunks of 1MB each.<br>

**Installation**<br>
run `npm install` to install all required npm packages.<br>
Tested on node v10.4.1 on macOS 10.11.6<br>
Mocha test suite can be run with `mocha test`

**Usage**<br>
node ./multiGet.js [OPTIONS] url<br>
Flags:
  + -o string<br>
    	Write output to <file> instead of default
  + -parallel<br>
    	Download chunks in parallel instead of serially
  + -chunk-count integer<br>
      Specify number of chunks. Default is 4.
  + -chunk-size integer<br>
      Specify the size of each chunk. Default is 1MB.<br>
      If a chunk-count is already specified, then the -chunk-size flag will be ignored.<br>
      Note: this value will be recalculated if the actual target file size is less than the specified total size.
  + -total-size integer<br>
      Specify the total download size. Default is 4MB.

**Examples**
  + `node index.js http://31279842.bwtest-aws.pravala.com/384MB.jar`
  + `node index.js -o my_file http://31279842.bwtest-aws.pravala.com/384MB.jar`
  + `node index.js -o my_file2 -chunk-size 512638 http://31279842.bwtest-aws.pravala.com/384MB.jar`
  + `node index.js -o my_file3 -chunk-count 5 http://31279842.bwtest-aws.pravala.com/384MB.jar`
  + `node index.js -o my_file4 -chunk-size 712638 -total-size 5000000 -parallel http://31279842.bwtest-aws.pravala.com/384MB.jar`
