import client from "./client";
import * as Discord from 'discord.js';

// Discord.js only provides reaction events for some messages by default. This means we won't always notice when one of our buttns is clicked, which is a problem.
// Luckily, someone else already made a script that emits a normal reaction event for the messages that wouldn't otherwise get them, so we just import that.
import "./uncached-reaction-events";

export { addHandlers, addFilteredHandlers };

// Discord.js's typings are out of date, and don't document a property we need. It does exist, though, so it's safe to use here.
declare module 'discord.js' {
	interface Message {
		deleted : boolean
	}
}

// Some type aliases for added clarity.
type EmoteID = string;
type ChannelID = string;
type Callback = (m : Discord.Message, u : Discord.User) => Promise<void>;
type Handler = [EmoteID, Callback];
type Filter = (m : Discord.Message) => Promise<boolean>;
type FilteredHandler = [EmoteID, Filter, Callback];

// A default filter that includes all messages.
const allFilter = async (m : Discord.Message) => true;

// Handlers might be registered before or after the client is ready.
// We don't want to try to use the client before it's ready, but once it is, there are tasks we want to do every time a handler is registered.
let clientReady = false;

// All registered handlers.
let handlersByChannel : Map<ChannelID, FilteredHandler[]> = new Map<ChannelID, FilteredHandler[]>();

// Registers a list of reaction handlers that apply to all messages in one channel.
async function addHandlers(channel : ChannelID, handlers : Handler[]) : Promise<void> {
	const filteredHandlers = handlers.map(([emote, callback]) => [emote, allFilter, callback] as FilteredHandler);
	await addFilteredHandlers(channel, filteredHandlers);
}
// Registers a list of reaction handlers that apply to only some messages in a channel.
async function addFilteredHandlers(channel : ChannelID, handlers : FilteredHandler[]) : Promise<void> {
	await runHandlers(channel, handlers);
	handlersByChannel.set(channel, (handlersByChannel.get(channel) || []).concat(handlers));
}

// Used to perform needed tasks for already-registered handlers when the client becomes ready.
async function runHandlers(channel : ChannelID, handlers : FilteredHandler[]) : Promise<void> {
	if (clientReady) {
		await Promise.all(handlers.map(async h => sweepChannel(channel, h[0], h[1], h[2])));
	}
}

// Handles everything that should have happened for a handler since the bot was last started.
// Specifically:
// - Adds the appropriate reaction to every message that should have it and doesn't
// - For any messages where the reaction has been clicked (or manually added by a user), calls the appropriate callback.
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

// Once the client is ready, sweep all channels for messages and reactions relevant to handlers that already got registered.
client.once('ready', async () => {
	clientReady = true;
	let hs : [ChannelID, FilteredHandler[]][] = [];
	handlersByChannel.forEach((v, k) => hs.push([k, v]));
	await Promise.all(hs.map(async e => {
		let [channel, handlers] = e;
		await runHandlers(channel, handlers);
	}));
});

// When a new message is received, check if it should have any reactions (buttons), and add them.
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

// When a user adds a reaction, see if it's for a registered handler, and call its callback if it is.
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

