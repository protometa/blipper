/* eslint-env mocha */

// var _ = require('highland')
// var request = require('superagent')
require('should')

var blipperClient = require('./index.js')

describe('blipperClient', function () {
  describe('getId', function () {
    it('should return ipfs id', function (done) {
      blipperClient.getId()
      .map(function (id) {
        // console.log(id)
        id.should.match(/(\w+).*/)
      })
      .toCallback(done)
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
