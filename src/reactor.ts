import client from "./client";
import * as Discord from 'discord.js';

import "./uncached-reaction-events";

export { addHandlers };

type EmoteID = string;
type ChannelID = string;
type Callback = (m : Discord.Message, u : Discord.User) => Promise<void>;
type Handler = [EmoteID, Callback];

let clientReady = false;

let handlersByChannel : Map<ChannelID, Handler[]> = new Map<ChannelID, Handler[]>();

async function addHandlers(channel : ChannelID, handlers : Handler[]) : Promise<void> {
	if (clientReady) {
		await Promise.all(handlers.map(async h => sweepChannel(channel, h[0], h[1])));
	}
	handlersByChannel.set(channel, handlers);
}

async function sweepChannel(channel : ChannelID, emote : EmoteID, callback : Callback) : Promise<void> {
	let ch = client.channels.get(channel) as Discord.TextChannel;
	if (!(ch instanceof Discord.TextChannel)) {
		throw new Error(`Invalid channel ID: ${channel}`);
	}
	let messages = await ch.fetchMessages();
	let e = client.emojis.get(emote) || emote;
	try {
	await Promise.all(messages.map(async msg => {
			let react = msg.reactions.get(emote);
			if (!(react && react.me)) {
				await msg.react(e);
			}
			if (react) {
				for (let [_, user] of (await react.fetchUsers()).filter(u => !u.bot)) {
					await callback(msg, user);
					if (!msg || msg.deleted) break;
					await react.remove(user);
				}
			}
		}));
	}
	catch (e) {
		console.error(e);
	}
}

client.once('ready', async () => {
	clientReady = true;
	let hs : [ChannelID, Handler[]][] = [];
	handlersByChannel.forEach((v, k) => hs.push([k, v]));
	await Promise.all(hs.map(async e => {
		let [channel, handlers] = e;
		await addHandlers(channel, handlers);
	}));
});

client.on('message', async msg => {
	let handlers = handlersByChannel.get(msg.channel.id);
	if (handlers) {
		for (let h of handlers) {
			await msg.react(h[0]);
		}
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) return;
	let handlers = handlersByChannel.get(reaction.message.channel.id);
	if (handlers) {
		let handler = handlers.find(h => h[0] === reaction.emoji.toString() ||
		                                 h[0] === reaction.emoji.id);
		if (handler) {
			try {
				await handler[1](reaction.message, user);
				if (reaction && reaction.message) await reaction.remove(user);
			}
			catch (e) {
				console.error(e);
			}
		}
	}
});

