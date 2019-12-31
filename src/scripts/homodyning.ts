import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import * as Reactor from "../reactor";

import "../recycle-core";

declare module "../config" {
	interface Config {
		homodyning: {
			deleteEmote: string;
			moveToChannel: string;
			startTimestamp: number;
			deleteCommand: string;
		}
	}
}

function escapeRegExp(str : string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const deleteCommandRegex = new RegExp(`^${escapeRegExp(config.homodyning.deleteCommand)} (\\d+)`); 

function getChannel(channel : string) : Discord.TextChannel {
	let c = (client.channels.get(channel) as Discord.TextChannel);
	if (!c) console.log("Couldn't find channel " + channel);
	return c;
}
async function moveMessage(msg : Discord.Message, channel : Discord.TextChannel) {
	let content = msg.content;
	await Promise.all([
		msg.delete(),
		channel.send(content)
	]);
}

client.on("ready", async () => {
	let moveToChannel = getChannel(config.homodyning.moveToChannel);
	await Reactor.addFilteredHandlers(config.recycle.channel, [
		[config.homodyning.deleteEmote,
			async msg => msg.createdTimestamp > config.homodyning.startTimestamp,
			msg => moveMessage(msg, moveToChannel),
			false],
	]);
});

client.on("message", async msg => {
	if (msg.channel.id === config.recycle.channel) {
		if (msg.content.startsWith(config.homodyning.deleteCommand)) {
			let match = msg.content.match(deleteCommandRegex);
			let messageID : string | null = null;
			if (match) {
				messageID = match[1];
			}
			let target : Discord.Message | null = null;
			if (messageID) {
				try {
					target = await msg.channel.fetchMessage(messageID);
				}
				catch {}
			}
			if (target && target.createdTimestamp > config.homodyning.startTimestamp) {
				await moveMessage(target, getChannel(config.homodyning.moveToChannel));
			}
			await msg.delete();
		}
	}
});
