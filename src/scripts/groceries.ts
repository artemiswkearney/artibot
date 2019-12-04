// A grocery list management system.
// Maintains three channels: the current grocery list, a list of items on their way (for example, groceries ordered on AmazonFresh), and a list of previously bought items for easy re-purchasing.
// Uses Reactor to provide buttons under each message.
import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import * as Reactor from "../reactor";
import { promisify } from 'util';

declare module "../config" {
	interface Config {
		groceries : {
			itemsChannel : string;
			historyChannel : string;
			orderedChannel : string;
			orderedEmote : string;
			boughtEmote : string;
			addToListEmote : string;
			deleteEmote : string;
		}
	}
}

// Called when an item is marked as bought from the current list channel.
// Moves the item to history.
async function handleBought(msg : Discord.Message) {
	console.log(`Bought: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.historyChannel) as Discord.TextChannel)
		.send(content);
}
// Called when an item is marked as ordered from the current list channel.
// Moves the item to the list of items on their way.
async function handleOrdered(msg : Discord.Message) {
	console.log(`Ordered: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.orderedChannel) as Discord.TextChannel)
		.send(content);
}
// Called when an item is marked as having arrived.
// Moves the item to history.
async function handleArrived(msg : Discord.Message) {
	console.log(`Arrived: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.historyChannel) as Discord.TextChannel)
		.send(content);
}
// Called when a user requests that an item in history be ordered again.
// Moves it from history to the current list.
async function handleAddToList(msg : Discord.Message) {
	console.log(`Adding to list: ${msg.content}`);
	let content = msg.content;
	await msg.delete();
	(client.channels.get(config.groceries.itemsChannel) as Discord.TextChannel)
		.send(content);
}
// Called when a user requests that an item in history be deleted, and does so.
async function handleDelete(msg : Discord.Message) {
	console.log(`Deleting: ${msg.content}`);
	msg.delete();
}

// Register our Reactor handlers.
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
