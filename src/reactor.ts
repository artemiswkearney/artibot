import client from "./client.js";
import * as Discord from 'discord.js';

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
	let ch = await client.channels.fetch(channel);
	if (!(ch?.type === Discord.ChannelType.GuildText)) {
		throw new Error(`Invalid channel ID: ${channel}`);
	}
	let messages = await ch.awaitMessages();
	let e = client.emojis.resolveId(emote) || emote;
	try {
	await Promise.all(messages.map(async msg => {
			if (!await filter(msg)) return;
			let react = msg.reactions.resolve(emote);
			if (!(react && react.me)) {
				await msg.react(e);
			}
			if (react) {
				for (let [_, user] of (await react.users.fetch()).filter(u => !u.bot)) {
					await callback(msg, user);
					if (!msg || msg.deleted) break;
					await react.users.remove(user);
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
client.on('messageCreate', async msg => {
	if (msg.partial) return;
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
client.on('messageReactionAdd', async (reaction_, user) => {
	const reaction = reaction_.partial
		? (await reaction_.fetch().catch(e => {
			//TODO log here?
			return undefined;
		}))
		: reaction_;
	if (reaction === undefined) return;
	if (user.bot) return;
	let handlers = handlersByChannel.get(reaction.message.channel.id);
	if (handlers) {
		let handler = handlers.find(h => h[0] === reaction.emoji.toString() ||
		                                 h[0] === reaction.emoji.id);
		if (handler && await handler[1](reaction.message as Discord.Message<boolean>)) {
			try {
				await handler[2](reaction.message as Discord.Message<boolean>, user as Discord.User);
				if (reaction && reaction.message && !reaction.message.deleted) await reaction.users.remove(user as Discord.User);
			}
			catch (e) {
				console.log("Exception caught in messageReactionAdd:");
				console.error(e);
			}
		}
	}
});

