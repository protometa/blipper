#!/usr/bin/env node

var Blipper = require('./index.js')

var client = new Blipper()

const arg = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('name  <username>', 'Set your username')
  .command('about <info>', 'Set your about info')
  .command('profile', 'View our username, about, and unique node id')
  .command('say <your_message>', 'Say something which your followers will see in their feeds')
  .command('add <friend_id>', 'Add unique id of another node to follow')
  .command('feed', 'Show your feed of your posts and posts by nodes you follow')
  .help('h')
  .alias('h', 'help')
  .demandCommand(2)
  .argv

const commands = {}

commands.profile = () => client.getProfile().map(profile => `name: ${profile.username}
about:  ${profile.about}
id:  ${profile.id}
`)

commands.feed = client.getFeed().map(post => (`${post.author.username || post.author.id} - ${new Date(post.time)}
${post.content}
`))

commands.name = client.setUsername
commands.about = client.setAbout
commands.say = client.post
commands.add = client.addFollowee

commands[arg._].apply(client, process.argv.slice(3)).invoke('toString').append('\n').pipe(process.stdout)
