import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import exitHook from 'async-exit-hook';
import * as ECS from "../ecs";

declare module "../config" {
	interface Config {
		shutdownOnUpdate: {
			updateChannel : string;
		}
		saveAndLoadECS: {
			saveChannel : string;
			path : string;
		}
	}
}

// A simple script to prevent multiple instances of the bot from running at the same time.
// On startup, the bot sends a message containing a nonce in a designated channel.
// Whenever a message is sent in that channel, the bot checks it against the nonce for this run. If it's different, that means the message was sent by a newer instance, so the bot shuts itself down.
// Also contains some code for saving and loading the state of the in-progress ECS module.

const number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
let ecsSaved = false;
let ecsLoaded = false;

ECS.load(config.saveAndLoadECS.path).then(() => {
	ecsLoaded = true;
});

client.once('ready', async () => {
	(client.channels.get(config.shutdownOnUpdate.updateChannel) as Discord.TextChannel)
		.send(number.toString());
});

client.on('message', async msg => {
	if (msg.channel.id === config.shutdownOnUpdate.updateChannel) {
		if (number.toString() !== msg.content) {
			if (ecsLoaded && !ecsSaved) {
				await ECS.save(config.saveAndLoadECS.path);
				await (client.channels.get(config.saveAndLoadECS.saveChannel) as Discord.TextChannel)
					.send("Saved ECS state");
				ecsSaved = true;
			}
			await client.destroy();
			process.exit(0);
		}
	}
	if (msg.channel.id === config.saveAndLoadECS.saveChannel && !ecsSaved) {
		await ECS.load(config.saveAndLoadECS.path);
		ecsLoaded = true;
	}
});

exitHook(callback => (async () => {
	if (ecsLoaded && !ecsSaved) {
		await ECS.save(config.saveAndLoadECS.path);
		await (client.channels.get(config.saveAndLoadECS.saveChannel) as Discord.TextChannel)
			.send("Saved ECS state (unexpected shutdown!)");
		ecsSaved = true;
	}
})().then(callback));
