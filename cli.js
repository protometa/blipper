#!/usr/bin/env node

var Blipper = require('./index.js')

var client = new Blipper()

const arg = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('name  <your_username>', 'Set your username')
  .command('about <info>', 'Set your about info')
  .command('profile', 'View our username, about, and unique node id')
  .command('say <your_message>', 'Say something which your followers will see in their feeds')
  .command('add <friend_id>', 'Add unique id of another node to follow')
  .command('feed', 'Show your feed of your posts and posts by nodes you follow')

  .example('$0 name konsumer', 'Set your name to "konsumer"')
  .example('$0 about "Mostly human"', 'Set your about-text')
  .example('$0 say "Hey planet!"', 'Say something')
  .example('$0 add QmUNfYBRgXqV1NDDiTws9vvFWtijZwMZCu6KENEVWGcG7k', 'Follow @protometa')

  .help('h')
  .alias('h', 'help')
  .demandCommand(2)
  .argv

const commands = {}

commands.profile = () => client.getProfile().map(profile => `name: ${profile.username}
about:  ${profile.about}
id:  ${profile.id}
`)

commands.feed = () => client.getFeed().map(post => (`${post.author.username || post.author.id} - ${new Date(post.time)}
${post.content}
`))

commands.name = () => client.setUsername(arg.your_username)
commands.about = () => client.setAbout(arg.info)
commands.say = () => client.post(arg.your_message)
commands.add = () => client.addFollowee(arg.friend_id)

commands[arg._]().invoke('toString').append('\n').pipe(process.stdout)
