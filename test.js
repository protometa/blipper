/* eslint-env mocha */

// var _ = require('highland')
// var request = require('superagent')
var _ = require('highland')
var request = require('superagent')
var should = require('should')

var Blipper = require('./index.js')
var client1 = new Blipper({
  node: 'ipfs-node-1:5001',
  gateway: 'ipfs-node-1:8080'
})

var client2 = new Blipper({
  node: 'ipfs-node-2:5001',
  gateway: 'ipfs-node-2:8080'
})

describe('blipperClient', function () {
  describe('getId()', function () {
    it('should return ipfs id', function (done) {
      client1.getId()
      .each(function (id) {
        console.log(id)
        id.should.match(/Qm(\w+).*/)
      })
      .done(done)
    })
  })

  describe('post()', function () {
    this.timeout(60 * 1000)
    it('should post something', function (done) {
      client1.post('hey planet')
      .flatMap(function (res) {
        console.log(res)
        return client1.readFile('/posts/recent/' + res)
      })
      .map(function (res) {
        console.log(res)
        res.should.eql('hey planet')
      })
      .done(done)
    })
    after('cleanup posts', function (done) {
      client1.removeFile('/posts/recent')
      .done(done)
    })
  })

  describe('addFollowee()', function () {
    this.timeout(10000)
    it('addes id to followees file', function (done) {
      client1.addFollowee('testID')
      .flatMap(function (res) {
        // console.log(res.status)
        return _(request.get('ipfs-node-1:5001/api/v0/files/read?arg=/blipper/followees').then())
      }).map(function (res) {
        // console.log(res.status)
        res.text.should.eql('testID')
      })
      .done(done)
    })
    after('cleanup followees file', function (done) {
      client1.removeFile('/blipper/followees')
      .done(done)
    })
  })

  describe('setUsername()', function () {
    it('sets username', function (done) {
      client1.setUsername('Client 1')
      .flatMap(function (res) {
        return client1.readFile('/username')
      })
      .map(function (name) {
        name.should.eql('Client 1')
      })
      .done(done)
    })
    after('cleanup', function (done) {
      client1.removeFile('/username')
      .done(done)
    })
  })

  describe('feed()', function () {
    this.timeout(3 * 60 * 1000)
    it('shows feed', function (done) {
      console.log('setting username')
      client1.setUsername('Client 1')
      .flatMap(function () {
        console.log('getting id')
        return client1.getId()
      })
      .flatMap(function (id) {
        // console.log(id)
        console.log('adding followee')
        return client2.addFollowee(id)
      }).flatMap(function (res) {
        // console.log(res.status)
        console.log('making post')
        return client1.post('hey planet')
      }).flatMap(function (res) {
        console.log('getting feed')
        return client2.getFeed()
      }).map(function (post) {
        console.log(post)
        post.content.should.eql('hey planet')
        should.exist(post.time)
        should.exist(post.hash)
        should.exist(post.author.id)
        post.author.username.should.eql('Client 1')
      })
      .done(done)
    })
    after('cleanup posts', function (done) {
      client1.removeFile('/posts/recent')
      .flatMap(function () {
        return client1.removeFile('/blipper/followees')
      })
      .done(done)
    })
  })
})

// blipperClient.post('well this is neat')
// .each(function (res) {
//   console.log(res)
// })

// request.highland = function () {
//   return _.wrapCallback(this.end)()
// }

// _(request('google.com/sldkjsldk')
// .then(function (res) {
//   return res
// }, function (err) {
//   throw new Error(err)
// }))
// .errors(function (err) {
//   console.log('err:', err.toString())
// })
// .each(function (res) {
//   console.log('res:', res)
// })
// .done(function () {
//   console.log('done')
// })

// _([1,2,3])
// .map(function (a) {
//   throw 'wtf'
// })
// .each(function (x) {
//   console.log(x)
// })

// p = request('google.com/sdfsd').then().then(function (res) {
//   console.log(res)
// }).catch(function (err) {
//   console.log(err)
// })

// request.Request.prototype.highland = function () {
//   return _.wrapCallback(this.end.bind(this))()
// }

// function wrap (req) {
//   return _.wrapCallback(req.end.bind(req))()
// }

// _.wrapCallback(request('google.com').end)().each(_.log)

// wrap(request('google.com/sdfsd')).each(_.log)

// request('google.com/lksdflk').highland().each(function (res) {
//   console.log(res.text)
// })

// request('google.com/lskjdflskd').highland().each(_.log)

// request('foaas.com/off/Joe/Luke').set('Accept', 'application/json')
//   .then(function (res) {
//     console.log(res.text)
//   })

// _(request.post('localhost:5001/api/v0/files/write?arg=/blipper/test.json&create')
//   .attach('data', new Buffer('super promise?')))
//   .map(function (err, res) {
//     if (err) {
//       if (res) {
//         console.log(res.text)
//       }
//       throw err
//     }
//     console.log(res.text)
//   .flatMap(function () {
//     return request.get('localhost:5001/api/v0/files/read?arg=/blipper/test.json')
//   }).each(function (res) {
//     console.log(res.text)
//   })

//   })
