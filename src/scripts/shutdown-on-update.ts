import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import nodeCleanup from 'node-cleanup';
import * as ECS from "../ecs";

const number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
let ecsSaved = false;

ECS.loadSync(config.saveAndLoadECS.path);

client.once('ready', async () => {
	(client.channels.get(config.shutdownOnUpdate.updateChannel) as Discord.TextChannel)
		.send(number.toString());
});

client.on('message', async msg => {
	if (msg.channel.id === config.shutdownOnUpdate.updateChannel) {
		if (number.toString() !== msg.content) {
			if (!ecsSaved) {
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
	}
});

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
