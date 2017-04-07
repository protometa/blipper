'use strict'

var _ = require('highland')
var request = require('superagent')
var p = require('path')

function Blipper (opts) {
  var opts = opts || {}
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

Blipper.prototype.writeFile = function (path, data) {
  var that = this
  return get(this.node + '/api/v0/files/mkdir?p&arg=/' + this.namespace + p.dirname(path))
  .flatMap(function () {
    return post(that.node + '/api/v0/files/write?create&truncate&arg=/' + that.namespace + path, data)
  })
}

Blipper.prototype.readFile = function (path) {
  return get(this.node + '/api/v0/files/read?arg=/' + this.namespace + path)
  .errors(function (err, push) {
    if (!(err.response && err.response.body.Message === 'file does not exist')) throw err
  })
  // .compact()
}

Blipper.prototype.removeFile = function (path) {
  return get(this.node + this.prefix + '/files/rm?recursive&arg=/' + this.namespace + path)
  // ignore not exists errors
  .errors(function (err) {
    if (!(err.response && /file does not exist/.test(err.response.body.Message))) throw err
  })
}

Blipper.prototype.listFiles = function (path) {
  return getJSON(this.node + this.prefix + '/files/ls?arg=/' + this.namespace + path)
}

Blipper.prototype.getRootHash = function () {
  return getJSON(this.node + '/api/v0/files/stat?arg=/').pluck('Hash')
}

Blipper.prototype.get = function (path) {
  return get(this.gateway + path)
}

Blipper.prototype.list = function (path) {
  return getJSON(this.node + this.prefix + '/ls?arg=' + path)
}

Blipper.prototype.cleanupRecent = function () {
  return this.listFiles('/posts/recent/')
  .errors(err => console.dir(err))
  .flatMap(res => _(res.Entries))
  // .filter(post => Date.now() - parseInt(post.Name) > 86400000) // post is older than 24 hrs
  .sortBy(function (postA, postB) {
    return parseInt(postA.Name) - parseInt(postB.Name)
  })
  .slice(30) // skip first n
  .map(function (post) {
    this.removeFile('/posts/recent/' + post.Name)
  })
  .collect()
}

Blipper.prototype.flushAndPublish = function () {
  var that = this
  return this.getRootHash()
  .flatMap(function (hash) {
    // console.log(hash)
    return get(that.node + that.prefix + '/name/publish?arg=' + hash)
  })
}

Blipper.prototype.getId = function () {
  return getJSON(this.node + this.prefix + '/id').pluck('ID')
}

Blipper.prototype.setUsername = function (username) {
  return this.writeFile('/username', username)
  .map(function (res) {
    return username
  })
}

Blipper.prototype.setAbout = function (about) {
  console.log(about)
  return this.writeFile('/about', about)
  .map(function (res) {
    return about
  })
}

Blipper.prototype.getProfile = function () {
  return _([this.readFile('/username').otherwise([null]), this.readFile('/about').otherwise([null]), this.getId()]).zipAll0()
  .map(function (results) {
    return {
      username: results[0],
      about: results[1],
      id: results[2]
    }
  })
}

Blipper.prototype.post = function (data) {
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
    return that.cleanupRecent()
  })
  .flatMap(function () {
    return that.flushAndPublish()
  })
  .map(function () {
    return date.getTime()
  })
}

Blipper.prototype.getFeed = function () {
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

Blipper.prototype.addFollowee = function (followeeId) {
  var that = this
  return this.readFile('/followees')
  .split()
  .append(followeeId)
  .uniq()
  .collect()
  .flatMap(function (followeesArr) {
    return that.writeFile('/followees', followeesArr.join('\n'))
  })
}

module.exports = Blipper
