import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';

declare module "../config" {
	interface Config {
		status: {
			statusCommand : string;
		}
	}
}

client.on('message', msg => {
	if (msg.content.startsWith(config.status.statusCommand)) {
		msg.channel.send(`Artibot!\nPID: ${process.pid}\nRunning on ${process.platform}`);
	}
});
