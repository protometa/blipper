'use strict'

var _ = require('highland')
var request = require('superagent')
var path = require('path')
var logger = require('superagent-logger')

var host = 'localhost:5001'

// extend superagent to spit out a highland stream
// (not a real stream of the body since that doesn't work on the browser,
// also lets us check the res.status)
request.Request.prototype.highland = function () {
  return _.wrapCallback(this.end.bind(this))()
}

// function throwOnErrorStatus (res) {
//   console.log(res.request.url, res.status)
//   if (res.error) {
//     throw new Error('HTTP error status '+res.status+' from '+res.request.url+': '+res.text)
//   } else {
//     return res
//   }
// }

function write (filePath, data) {
  var dir = path.dirname(filePath)
  return request.get(host+'/api/v0/files/mkdir?p&arg=/blipper'+dir)
    .use(logger)
    .highland()
    .flatMap(function () {
      return request.post(host+'/api/v0/files/write?arg=/blipper'+filePath+'&create')
        .attach('data', new Buffer(JSON.stringify(data)))
        .use(logger)
        .highland()
    })
}

function read (filePath) {
  return _(request.get(host+'/api/v0/files/read?arg=/blipper'+filePath)
    .then(throwOnErrorStatus))
    .map(function (res) {
      return JSON.parse(res.text)
    })
}

function listFile (nodePath) {
  return request.get(host + '/api/v0/file/ls?arg=' + nodePath)
    .highland()
    .pluck('text')
}

function getFileHash () {
  return request.get(host + '/api/v0/files/stat?hash&arg=/')
    .highland()
    .pluck('text')
}

exports.flushAndPublish = function () {
  return getFileHash()
    .flatMap(function (hash) {
      return request(host + '/api/v0/name/publish?arg=' + hash)
        .highland()
    })
}

exports.getId = function () {
  return request(host + '/api/v0/id')
    .highland()
    .map(function (res) {
      return res.body.ID
    })
}

// function streamOrCallback (stream, cb) {
//   if (cb) {
//     return stream.toCallback(cb)
//   } else {
//     return stream
//   }
// }

/**
 * Sets the host.
 *
 * @param      {String}  host    The host ipfs node
 */
exports.setHost = function (newHost) {
  host = newHost
}

/**
 * Sets the username for this node.
 *
 * @param      {String}    username The username
 * @param      {Function}  cb       Callback
 */
exports.setUsername = function (username, cb) {
  return writeJsonFile('/username', username)
}

/**
 * Sets the bio for this node.
 *
 * @param      {String}    bio      The bio
 * @param      {Function}  cb       Callback
 */
exports.setBio = function (bio, cb) {
  return writeJsonFile('/bio', bio)
}

exports.post = function (data) {
  var date = new Date()
  console.log('/posts/' + date.getUTCFullYear() + '/' + date.getUTCMonth() + '/' + date.getTime())
  return writeJsonFile('/posts/' + date.getUTCFullYear() + '/' + date.getUTCMonth() + '/' + date.getTime(), data)
}

/**
 * Gets recent posts by you and your followees
 */
exports.getFeed = function () {
  var date = new Date()
  // get last two months
  // months are zero index so add one
  var currYearMonth = date.getUTCFullYear() + '/' + (date.getUTCMonth() + 1)
  // this will handling rolling back to prev years
  date.setUTCMonth(date.getUTCMonth() - 1)
  var prevYearMonth = date.getUTCFullYear() + '/' + (date.getUTCMonth() + 1)

  readJsonFile('/followees.json')
  .flatMap(function (followees) {
    return _(followees)
  }).flatMap(function (followee) {
    return _([prevYearMonth, currYearMonth])
    .map(function (yearMonth) {
      return listFile('/ipns/' + followee + '/posts/' + yearMonth)
        .split()
        .map(function (postId) {
          return '/ipns/' + followee + '/posts/' + yearMonth + '/' + postId
        })
    })
  }).parallel(4)
}

exports.addFollowee = function (followeeId) {
  return readJsonFile('/followees.json')
  .map(function (followees) {
    followees.push(followeeId)
    return followees
  }).flatMap(function (followees) {
    return writeJsonFile('/followees.json', followees)
  })
}
