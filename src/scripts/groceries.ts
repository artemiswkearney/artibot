import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import * as Reactor from "../reactor";
import { promisify } from 'util';

async function handleBought(msg : Discord.Message) {
	console.log(`Bought: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.historyChannel) as Discord.TextChannel)
		.send(content);
}
async function handleOrdered(msg : Discord.Message) {
	console.log(`Ordered: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.orderedChannel) as Discord.TextChannel)
		.send(content);
}
async function handleArrived(msg : Discord.Message) {
	console.log(`Arrived: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.historyChannel) as Discord.TextChannel)
		.send(content);
}
async function handleAddToList(msg : Discord.Message) {
	console.log(`Adding to list: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.itemsChannel) as Discord.TextChannel)
		.send(content);
}

async function handleDelete(msg : Discord.Message) {
	console.log(`Deleting: ${msg.content}`);
	msg.delete();
}

Reactor.addHandlers(config.groceries.itemsChannel,
	[
		[config.groceries.boughtEmote, handleBought],
		[config.groceries.orderedEmote, handleOrdered],
	]);
Reactor.addHandlers(config.groceries.orderedChannel,
	[
		[config.groceries.boughtEmote, handleArrived],
		[config.groceries.addToListEmote, handleAddToList],
	]);
Reactor.addHandlers(config.groceries.historyChannel,
	[
		[config.groceries.addToListEmote, handleAddToList],
		[config.groceries.deleteEmote, handleDelete],
	]);
/*
client.once('ready', async () => {
	async function ensureReacts(channel : string, emoji : string) : Promise<Discord.Message[]> {
		let result : Discord.Message[] = [];
		let ch = client.channels.get(channel) as Discord.TextChannel;
		if (!(ch instanceof Discord.Channel)) {
			console.log(`Couldn't find channel: ${channel}`);
			return result;
		}
		let messages = await ch.fetchMessages();
		// works for reacting with both server and Unicode emoji
		let e = client.emojis.get(emoji) || emoji;
		await Promise.all(messages.map(async msg => {
			let react = msg.reactions.get(emoji);
			if (!(react && react.me)) {
				await msg.react(e);
			}
			if (react && (await react.fetchUsers()).some(u => !u.bot)) {
				result.push(msg);
			}
		}));
		return result;
	}
	async function handleReacts(channel : string, emote : string, handler : (m : Discord.Message) => Promise<void>) : Promise<void> {
		let items = await ensureReacts(channel, emote);
		await Promise.all(items.map(handler));
	}
	handleReacts(config.groceries.itemsChannel, config.groceries.boughtEmote, handleBought);
	handleReacts(config.groceries.itemsChannel, config.groceries.orderedEmote, handleOrdered);
	handleReacts(config.groceries.historyChannel, config.groceries.addToListEmote, handleAddToList);
	handleReacts(config.groceries.historyChannel, config.groceries.deleteEmote, handleDelete);
	handleReacts(config.groceries.orderedChannel, config.groceries.boughtEmote, handleArrived);
	handleReacts(config.groceries.orderedChannel, config.groceries.addToListEmote, handleAddToList);
});

client.on('message', async msg => {
	if (msg.channel.id === config.groceries.itemsChannel) {
		await msg.react(config.groceries.boughtEmote);
		await msg.react(config.groceries.orderedEmote);
	}
	if (msg.channel.id === config.groceries.orderedChannel) {
		await msg.react(config.groceries.boughtEmote);
		await msg.react(config.groceries.addToListEmote);
	}
	if (msg.channel.id === config.groceries.historyChannel) {
		await msg.react(config.groceries.addToListEmote);
		await msg.react(config.groceries.deleteEmote);
	}
});

client.on('messageReactionAdd', (reaction, user)  => {
	if (user.bot) return;
	if (reaction.message.channel.id === config.groceries.itemsChannel) {
		if (reaction.emoji.toString() === config.groceries.boughtEmote ||
			reaction.emoji.id === config.groceries.boughtEmote)
			handleBought(reaction.message);
		if (reaction.emoji.toString() === config.groceries.orderedEmote ||
			reaction.emoji.id === config.groceries.orderedEmote)
			handleOrdered(reaction.message);
	}
	else if (reaction.message.channel.id === config.groceries.orderedChannel) {
		if (reaction.emoji.toString() === config.groceries.boughtEmote ||
			reaction.emoji.id === config.groceries.boughtEmote)
			handleArrived(reaction.message);
		if (reaction.emoji.toString() === config.groceries.addToListEmote ||
			reaction.emoji.id === config.groceries.addToListEmote)
			handleAddToList(reaction.message);
	}
	else if (reaction.message.channel.id === config.groceries.historyChannel) {
		if (reaction.emoji.toString() === config.groceries.addToListEmote ||
			reaction.emoji.id === config.groceries.addToListEmote)
			handleAddToList(reaction.message);
		if (reaction.emoji.toString() === config.groceries.deleteEmote ||
			reaction.emoji.id === config.groceries.deleteEmote)
			handleDelete(reaction.message);
	}
});
*/
