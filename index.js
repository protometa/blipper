'use strict'

var _ = require('highland')
var request = require('superagent')
var path = require('path')

function BlipperClient (opts) {
  this.node = opts.node || 'localhost:5001'
  this.gateway = opts.gateway || 'localhost:8080'
  this.namespace = opts.blipper || 'blipper'
  this.prefix = opts.prefix || '/api/v0'
}

function get (path) {
  return _(request.get(path).then()).pluck('text')
}

function getJSON (path) {
  return _(request.get(path).then()).pluck('body')
}

function post (path, data) {
  return _(request.post(path)
  .attach('data', new Buffer(data))
  .then())
}

BlipperClient.prototype.writeFile = function (filePath, data) {
  var that = this
  return get(this.node + '/api/v0/files/mkdir?p&arg=/' + this.namespace + path.dirname(filePath))
  .flatMap(function () {
    return post(that.node + '/api/v0/files/write?create&truncate&arg=/' + that.namespace + filePath, data)
  })
}

BlipperClient.prototype.readFile = function (filePath) {
  return get(this.node + '/api/v0/files/read?arg=/' + this.namespace + filePath)
  // .compact()
}

BlipperClient.prototype.removeFile = function (filePath) {
  return get(this.node + '/api/v0/files/rm?recursive&arg=/' + this.namespace + filePath)
  // ignore not exists errors
  .errors(function (err) {
    if (!(err.response && /file does not exist/.test(err.response.body.Message))) throw err
  })
}

BlipperClient.prototype.listFiles = function (filePath) {
  return get(this.node + '/api/v0/file/ls?arg=/' + this.namespace + filePath)
}

BlipperClient.prototype.getRootHash = function () {
  return getJSON(this.node + '/api/v0/files/stat?arg=/').pluck('Hash')
}

BlipperClient.prototype.get = function (path) {
  return get(this.gateway + path)
}

BlipperClient.prototype.list = function (path) {
  return getJSON(this.node + this.prefix + '/ls?arg=' + path)
}

BlipperClient.prototype.cleanupRecent = function () {
  return this.listFiles('/post/recent/')
    .split()
    // .sort() // necessary?
    .slice(50) // skip first 50
    .each(function (file) {
      this.removeFile(file)
    })
}

BlipperClient.prototype.flushAndPublish = function () {
  var that = this
  return this.getRootHash()
  .flatMap(function (hash) {
    // console.log(hash)
    return get(that.node + that.prefix + '/name/publish?arg=' + hash)
  })
}

BlipperClient.prototype.getId = function () {
  return getJSON(this.node + this.prefix + '/id').pluck('ID')
}

BlipperClient.prototype.setUsername = function (username, cb) {
  return this.writeFile('/username', username)
}

BlipperClient.prototype.setBio = function (bio, cb) {
  return this.writeFile('/bio', bio)
}

BlipperClient.prototype.post = function (data) {
  var that = this
  var date = new Date()
  // console.log('/posts/archive' + date.getUTCFullYear() + '/' + (date.getUTCMonth() + 1) + '/' + date.getTime())
  return _([
    this.writeFile('/posts/recent/' + date.getTime(), data),
    this.writeFile('/posts/archive/' + date.getUTCFullYear() + '/' + (date.getUTCMonth() + 1) + '/' + date.getTime(), data) // should be copied? non blocking
  ])
  .sequence()
  .collect()
  .flatMap(function () {
    return that.flushAndPublish()
  })
  .map(function () {
    return date.getTime()
  })
  // .doto(cleanupRecent) // should be done with observe to not block
}

BlipperClient.prototype.getFeed = function () {
  var that = this
  return this.readFile('/followees')
  .split()
  // .tap(_.log)
  .map(function (id) {
    return that.get('/ipns/' + id + '/' + that.namespace + '/username')
      .errors(function (err, push) {
        if (err.status !== 404) throw err
        push(null)
      })
      .map(function (username) {
        return {id: id, username: username}
      })
  })
  .parallel(4) // resolve usernames
  // .tap(_.log)
  .map(function (followee) {
    return that.list('/ipns/' + followee.id + '/' + that.namespace + '/posts/recent/') // different list method
    .errors(function (err) {
      if (err.status !== 404) throw err
    })
    .flatMap(function (res) {
      return _(res.Objects[0].Links)
    })
  // .tap(_.log)
    .map(function (post) {
      return {
        time: parseInt(post.Name),
        hash: post.Hash,
        author: followee
      }
    })
  }).parallel(4) // resolve recent posts
  .sortBy(function (postA, postB) {
    return postA.time - postB.time
  })
  .map(function (post) {
    return that.get('/ipfs/' + post.hash)
    .map(function (content) {
      return Object.assign({content: content}, post)
    })
  })
  .parallel(4) // resolve posts content
  // .tap(_.log)
}

BlipperClient.prototype.addFollowee = function (followeeId) {
  var that = this
  return this.readFile('/followees')
  // ignore not exists errors
  .errors(function (err) {
    if (err.response && err.response.body.Message !== 'file does not exist') throw err
  })
  .errors(function (err) {
    if (!(err.response && /file does not exist/.test(err.response.body.Message))) throw err
  })
  .split()
  .append(followeeId)
  .uniq()
  .collect()
  .flatMap(function (followeesArr) {
    return that.writeFile('/followees', followeesArr.join('\n'))
  })
}

module.exports = BlipperClient
