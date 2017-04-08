#!/usr/bin/env node

var Blipper = require('./index.js')
var _ = require('highland')

var client = new Blipper()

var command = process.argv[2] || 'help'

var commands = {
  profile: function () {
    return client.getProfile().map(function (profile) {
      return 'name: ' + profile.username + '\n' +
      'about: ' + profile.about + '\n' +
      'id: ' + profile.id
    })
  },
  name: client.setUsername,
  about: client.setAbout,
  say: client.post,
  add: client.addFollowee,
  feed: function () {
    return client.getFeed().map(function (post) {
      return (post.author.username || post.author.id) + ' - ' + (new Date(post.time)).toString() + '\n' +
      '  ' + post.content + '\n'
    })
  },
  help: function () {
    return _.of(
      'usage: blipper <command> [<arg>]\n' +
      'commands:\n' +
      '  name     Set your username\n' +
      '  about    Set your about info\n' +
      '  profile  View our username, about, and unique node id\n' +
      '  say      Say something which your followers will see in their feeds\n' +
      '  add      Add unique id of another node to follow\n' +
      '  feed     Show your feed of your posts and posts by nodes you follow\n'
    )
  }
}

commands[command].apply(client, process.argv.slice(3)).invoke('toString').append('\n').pipe(process.stdout)
