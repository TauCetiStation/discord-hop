# discord-byond

Discord.js bot allow users without rename permission get a name corresponding to the Byond-ckey, and also get special group.

Docker-compose example:
```
version: '3'
services:
  discord-byond:
    build:
        context: .
    restart: always
    environment:
      - DISCORD_TOKEN=your discord tocken
      - VERIFIED_GROUP=Verified Byond
      - MAIN_CHANNEL_ID=channel id for bot (optional)
```
