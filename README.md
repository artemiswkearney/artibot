# Artibot!
A modular Discord bot for household automation, built with [Discord.js](https://github.com/discordjs/discord.js). Designed to make adding new features quick and easy.
## Modularity
The core of Artibot doesn't do much - it spins up a Discord client, starts a minimal webserver so Google Cloud AppEngine will know it started successfully, and... that's about it. The real functionality comes from loaded scripts (in the folder `src/scripts`), meaning new features naturally turn out modular, and can be removed or disabled without affecting the bot's other functionality and without needing to hunt through every file and remove references to the feature.

The scripts in the repo currently are all the things I use the bot for - if they happen to be exactly what you need, then you can use them out of the box by setting up a `config.json` before starting/deploying the bot, but otherwise the code is there to be used as inspiration or as a template.
## Reactor
[Reactor](https://github.com/artemiswkearney/artibot/blob/master/src/reactor.ts) is a one-file library used for providing message reactions that function as buttons on every message (or every message matching a filter) in a specified channel. I built it because tapping/clicking a reaction seemed like a much less clunky interface than typing a command, and because I found that it was often useful to be able to do a specific list of things to one message at a time. It's been invaluable in building new features quickly.
## Hosting
Although you can host the bot anywhere you can run Node, I'm using Google Cloud AppEngine to take advantage of some free trial credit. Since this isn't really a *website*, this is a bit of a nonstandard use case, but the `app.yaml` file in the repo should be all it takes to make it work.

Run `npm deploy` to deploy the bot to Google Cloud, or `npm build:live` to run the bot locally, with a watcher restarting it whenever you modify a `.ts` file.
