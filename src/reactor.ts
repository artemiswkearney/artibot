import client from "./client";
import * as Discord from 'discord.js';

import "./uncached-reaction-events";

export { addHandlers, addFilteredHandlers };

declare module 'discord.js' {
	interface Message {
		deleted : boolean
	}
}

type EmoteID = string;
type ChannelID = string;
type Callback = (m : Discord.Message, u : Discord.User) => Promise<void>;
type Handler = [EmoteID, Callback];
type Filter = (m : Discord.Message) => Promise<boolean>;
type FilteredHandler = [EmoteID, Filter, Callback];

const allFilter = async (m : Discord.Message) => true;

let clientReady = false;

let handlersByChannel : Map<ChannelID, FilteredHandler[]> = new Map<ChannelID, FilteredHandler[]>();

async function addHandlers(channel : ChannelID, handlers : Handler[]) : Promise<void> {
	const filteredHandlers = handlers.map(([emote, callback]) => [emote, allFilter, callback] as FilteredHandler);
	await addFilteredHandlers(channel, filteredHandlers);
}
async function addFilteredHandlers(channel : ChannelID, handlers : FilteredHandler[]) : Promise<void> {
	await runHandlers(channel, handlers);
	handlersByChannel.set(channel, (handlersByChannel.get(channel) || []).concat(handlers));
}

async function runHandlers(channel : ChannelID, handlers : FilteredHandler[]) : Promise<void> {
	if (clientReady) {
		await Promise.all(handlers.map(async h => sweepChannel(channel, h[0], h[1], h[2])));
	}
}

async function sweepChannel(channel : ChannelID, emote : EmoteID, filter : Filter, callback : Callback) : Promise<void> {
	let ch = client.channels.get(channel) as Discord.TextChannel;
	if (!(ch instanceof Discord.TextChannel)) {
		throw new Error(`Invalid channel ID: ${channel}`);
	}
	let messages = await ch.fetchMessages();
	let e = client.emojis.get(emote) || emote;
	try {
	await Promise.all(messages.map(async msg => {
			if (!await filter(msg)) return;
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
		console.log("Exception caught in sweepChannel:");
		console.error(e);
	}
}

client.once('ready', async () => {
	clientReady = true;
	let hs : [ChannelID, FilteredHandler[]][] = [];
	handlersByChannel.forEach((v, k) => hs.push([k, v]));
	await Promise.all(hs.map(async e => {
		let [channel, handlers] = e;
		await runHandlers(channel, handlers);
	}));
});

client.on('message', async msg => {
	let handlers = handlersByChannel.get(msg.channel.id);
	if (handlers) {
		for (let h of handlers) {
			if (await h[1](msg)) {
				await msg.react(h[0]);
			}
		}
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) return;
	let handlers = handlersByChannel.get(reaction.message.channel.id);
	if (handlers) {
		let handler = handlers.find(h => h[0] === reaction.emoji.toString() ||
		                                 h[0] === reaction.emoji.id);
		if (handler && await handler[1](reaction.message)) {
			try {
				await handler[2](reaction.message, user);
				if (reaction && reaction.message && !reaction.message.deleted) await reaction.remove(user);
			}
			catch (e) {
				console.log("Exception caught in messageReactionAdd:");
				console.error(e);
			}
		}
	}
});

