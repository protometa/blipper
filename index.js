
var _ = require('highland')
var request = require('superagent')
var path = require('path')
var logger = require('superagent-logger')

var host = 'localhost:5001'

function write (filePath, data) {
  var dir = path.dirname(filePath)
  return request.get(host + '/api/v0/files/mkdir?p&arg=/blipper' + dir)
    .use(logger)
    .highland()
    .flatMap(function () {
      return request.post(host + '/api/v0/files/write?arg=/blipper' + filePath + '&create')
        .attach('data', new Buffer(JSON.stringify(data)))
        .use(logger)
        .highland()
    })
}

function read (filePath) {
  return _(request.get(host + '/api/v0/files/read?arg=/blipper' + filePath)
    .then(throwOnErrorStatus))
    .map(function (res) {
      return JSON.parse(res.text)
    })
}

function list (filePath, cb) {
  // body...
}

function streamOrCallback (stream, cb) {
  if (cb) {
    return stream.toCallback(cb)
  } else {
    return stream
  }
}

/**
 * Sets the host.
 *
 * @param      {String}  host    The host ipfs node
 */
exports.setHost = function (host) {
  host = host
}

/**
 * Sets the profile for this node.
 *
 * @param      {Object}    profile  The profile data
 * @param      {Function}  cb       Callback
 */
exports.setProfile = function (profile, cb) {
  // TODO validate
  return streamOrCallback(write('/profile.json', profile), cb)
}

/**
 * Gets the profile of this node.
 *
 * @param      {Function}  cb      Callback
 */
exports.getProfile = function (cb) {
  return streamOrCallback(read('/profile.json'), cb)
}

exports.post = function (data, cb) {
  var date = new Date()
  console.log('/posts/' + date.getUTCFullYear() + '/' + date.getUTCMonth() + '/' + date.getTime())
  return streamOrCallback(write('/posts/' + date.getUTCFullYear() + '/' + date.getUTCMonth() + '/' + date.getTime(), data), cb)
}

/**
 * Gets recent posts by you and your followees
 */
exports.getRecentPosts = function () {
  var date = new Date()
  var currMonth = date.getUTCMonth()
  date.setUTCMonth(date.getUTCMonth() - 1)
  var prevMonth = date.getUTCMonth()

  read('/followees.json')
  .flatMap(function (followees) {
    return _(followees)
  }).flatMap(function (followee) {
    return _([prevMonth, currMonth])
    .map(function (month) {
      return request(host + '/ipfs/' + followee + '/posts/' + date.getUTCFullYear() + '/' + month + '.json')
        .then()
    })
  }).parallel(4)
}

