
Javascript client for a distributed social network over the Interplanetary Filesystem (IPFS)

# Usage

    npm install blipper

    var Blipper = require('blipper')
    var client1 = new Blipper({
      node: 'ipfs-node:5001',
      gateway: 'ipfs-node:8080'
    })

# CLI

    npm install --global blipper

To use the CLI (Install and run IPFS)[https://ipfs.io/docs/install/] locally. Blipper will connect with the node over the default ports.

Set your username (Doesn't have to be unique)

    blipper name <your username>

Set your about

    blipper about "Mostly human"

View your profile (Share your unique ID with friends)

    blipper profile

Say something

    blipper say "Hey planet!"

Add friends' IDs to follow

    blipper add QmUNfYBRgXqV1NDDiTws9vvFWtijZwMZCu6KENEVWGcG7k

Show feed of posts by people you follow

    blipper feed

