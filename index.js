'use strict'

var _ = require('highland')
var request = require('superagent')
var path = require('path')

var host = 'localhost:5001'
var namespace = 'blipper'

function writeFile (filePath, data) {
  return _(request.get(host + '/api/v0/files/mkdir?p&arg=/' + namespace + path.dirname(filePath)))
    .flatMap(function () {
      return _(request.post(host + '/api/v0/files/write?arg=/' + namespace + filePath + '&create')
        .attach('data', new Buffer(data)))
    })
}

function readFile (filePath) {
  return _(request.get(host + '/api/v0/files/read?arg=/' + namespace + filePath))
    .pluck('text')
}

function listFiles (filePath) {
  return _(request.get(host + '/api/v0/file/ls?arg=/' + namespace + filePath))
    .pluck('text')
}

function getRootHash () {
  return _(request.get(host + '/api/v0/files/stat?hash&arg=/'))
    .pluck('text')
}

function cleanupRecent () {
  return listFiles('/post/recent/')
    .split()
    // .sort() // necessary?
    .slice(50) // skip first 50
    .each(function (file) {
      removeFile(file)
    })
}

exports.flushAndPublish = function () {
  return getRootHash()
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
  return writeFile('/username', username)
}

/**
 * Sets the bio for this node.
 *
 * @param      {String}    bio      The bio
 * @param      {Function}  cb       Callback
 */
exports.setBio = function (bio, cb) {
  return writeFile('/bio', bio)
}

exports.post = function (data) {
  var date = new Date()
  // console.log('/posts/archive' + date.getUTCFullYear() + '/' + (date.getUTCMonth() + 1) + '/' + date.getTime())
  return _([
    writeFile('/posts/recent/' + date.getTime(), data),
    writeFile('/posts/archive/' + date.getUTCFullYear() + '/' + (date.getUTCMonth() + 1) + '/' + date.getTime(), data) // should be copied? non blocking
  ]).sequence()
  .doto(cleanupRecent) // should be done with observe to not block
}

/**
 * Gets recent posts by you and your followees
 */
exports.getFeed = function () {
  readFile('/followees')
  .split()
  .map(function (id) {
    return get('/ipns/' + id + '/' + namespace + '/username')
      .map(function (username) {
        return {id: id, username: username}
      })
  })
  .parallel(4) // resolve usernames
  .map(function (followee) {
    return list('/ipns/' + followee.id + '/' + namespace + '/posts/recent/') // different file list
      .split()
      .map(function (time) {
        return Object.assign({time: time}, followee)
      })
      .map(function (post) {
        return get('/ipns/' + post.id + '/' + namespace + '/posts/recent/' + post.time)
          .map(function (content) {
            return Object.assign({content: content}, post)
          })
      })
  }).parallel(4) // resolve recent posts
  .sortBy(function (postA, postB) {
    return parseInt(postA.time) - parseInt(postB.time)
  })
  .parallel(4) // resolve posts contente
}

exports.addFollowee = function (followeeId) {
  return appendFile('/followees', followeeId)
  // get info to jumpstart ipns
}
