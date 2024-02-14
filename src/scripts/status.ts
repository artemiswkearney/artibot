import client from "../client.js";
import config from "../config.js";
import * as Discord from 'discord.js';

declare module "../config" {
	interface Config {
		status: {
			statusCommand : string;
		}
	}
}

client.on('messageCreate', msg => {
	if (msg.partial) return;
	if (msg.content.startsWith(config.status.statusCommand)) {
		msg.channel.send(`Artibot!\nPID: ${process.pid}\nRunning on ${process.platform}`);
	}
});
