import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import nodeCleanup from 'node-cleanup';
// import * as ECS from "../ecs";

// A simple script to prevent multiple instances of the bot from running at the same time.
// On startup, the bot sends a message containing a nonce in a designated channel.
// Whenever a message is sent in that channel, the bot checks it against the nonce for this run. If it's different, that means the message was sent by a newer instance, so the bot shuts itself down.
// Also contains some commented-out code for saving and loading the state of the in-progress ECS module.

const number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
let ecsSaved = false;

// ECS.loadSync(config.saveAndLoadECS.path);

client.once('ready', async () => {
	(client.channels.get(config.shutdownOnUpdate.updateChannel) as Discord.TextChannel)
		.send(number.toString());
});

client.on('message', async msg => {
	if (msg.channel.id === config.shutdownOnUpdate.updateChannel) {
		if (number.toString() !== msg.content) {
			/*
			if (!ecsSaved) {
				await ECS.save(config.saveAndLoadECS.path);
				await (client.channels.get(config.saveAndLoadECS.saveChannel) as Discord.TextChannel)
					.send("Saved ECS state");
				ecsSaved = true;
			}
			 */
			await client.destroy();
			process.exit(0);
		}
	}
	/*
	if (msg.channel.id === config.saveAndLoadECS.saveChannel && !ecsSaved) {
		await ECS.load(config.saveAndLoadECS.path);
	}
	 */
});

/*
nodeCleanup(() => {
	if (!ecsSaved) {
		ECS.saveSync(config.saveAndLoadECS.path);
		(client.channels.get(config.saveAndLoadECS.saveChannel) as Discord.TextChannel)
			.send("Saved ECS state (unexpected shutdown!)")
			.then(() => {
				ecsSaved = true;
			})
			.catch(() => {});
	}
});
*/
