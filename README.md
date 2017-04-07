
Javascript client for a distributed social network over the Interplanetary Filesystem (IPFS)

Data structure

- blipper/
    + profile
    + posts/
        * [year]/
            - [month]
    + followees


Features

- set profile
- view profile
- follow other
- view other profile
- make post
- view followees posts

# Install IPFS

A connection to an IPFS node is required. Install and run IPFS localy.

# CLI

The CLI requires a connection to an IPFS node. Install and run the IPFS deamon and it will connect on the default port.

Set your username (Doesn't have to be unique)

    blipper name <your username>

Set your about

    blipper about "Mostly human"

View your profile (Share your unique ID with friends)

    blipper profile

Say something

    blipper say "Hey planet!"

Post a file

    blipper post /path/to/file

Add friends' IDs to follow

    blipper add QmUNfYBRgXqV1NDDiTws9vvFWtijZwMZCu6KENEVWGcG7k

Show feed of posts by people you follow

    blipper [feed]

Show someone else's feed

    blipper feed <friends name>
