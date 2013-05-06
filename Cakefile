# Don't forget to 'npm install' first!

{exec} = require 'child_process'
fs = require('fs')
path = require 'path'
_ = require 'underscore' 

task 'clean', 'Clean build dirs', ->
   clean()

task 'compile', 'Compile the coffee script src', ->
  cleanCompile()

task 'all', 'All tasks', ->
  all()

task 'start-server', 'Start a localhost web app serving .', ->
  startServer()

failOr = (callback) ->
  (err) ->
    throw err if err
    return callback() if callback

all = (callback) ->
  cleanCompile callback

clean = (callback) ->
  console.log 'clean'
  eachAsync ['build', 'docs'],
    (dir, callback) ->
      shell "rm -rf #{dir}", failOr callback
    failOr callback

compile = (callback) ->
  console.log 'compile'
  
  shell "coffee  -o public -j keepr.js -c src/*.coffee",
    failOr () ->
      shell "lessc  src/keepr.less public/keepr.css",
        failOr callback

cleanCompile = (callback) ->
  clean ->
    compile callback

startServer = (callback) ->
  connect = require('connect')
  connect.createServer(
          connect.static __dirname
  ).listen 8080
  console.log 'Browse http://localhost:8080/public/index.html to run browser tests'
  return callback() if callback

shell = (cmd, callback) ->
  exec cmd, (err, stdout, stderr) ->
    console.log stdout + stderr
    callback err

shellForStdin = (cmd, callback) ->
  exec cmd, (err, stdout, stderr) ->
    console.log stderr
    callback err, stdout

# TODO make an underscore extension for the following async tasks or use async directly
eachAsync = (arr, iterator, callback) ->
  complete = _.after arr.length, callback
  _.each arr, (item) ->
    iterator item, (err) ->
      if err
        callback(err)
        callback = () ->
      else
        complete()

eachSerial = (arr, iterator, callback) ->
  if not arr then return callback()
  serialized = _.reduceRight arr,
    (memo, item) -> _.wrap memo,
      (next) -> iterator item, (err) ->
        if err
          callback(err)
        else
          next()
    callback
  serialized()

