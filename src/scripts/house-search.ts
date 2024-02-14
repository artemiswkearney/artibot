/*
import client from "../client.js";
import config from "../config.js";
import * as Discord from 'discord.js';
import * as Reactor from "../reactor.js";
import * as ECS from "../ecs.js";

declare module "../config" {
	interface Config {
		houseSearch: {
			listingsChannel : string;
			housesChannel : string;
			contactedChannel : string;
			actionNeededChannel : string;
			rejectedChannel : string;
			vettedReact : string;
			contactedReact : string;
			actionNeededReact : string;
			actionTakenReact : string;
			actionNotNeededReact : string;
			rejectedReact : string;
			actionNeededFromRole : string;
		}
	}
}

ECS.componentNamespace("houseSearch");
type MessageJSON = {
	channel : string;
	id : string;
};
async function findMessage(m : MessageJSON) : Promise<Discord.Message | null> {
	try {
		return await getChannel(m.channel)!
			.fetchMessage(m.id);
	}
	catch {
		return null;
	}
}
function flattenMessage(m : Discord.Message) : MessageJSON {
	return {
		channel : m.channel.id,
		id : m.id
	};
}
const message = new ECS.Component<MessageJSON>("message");

type UserID = string;
const contactUser = new ECS.Component<UserID>("contactUser");
const vettedBy = new ECS.Component<UserID[]>("vettedBy");
const rejectedBy = new ECS.Component<UserID>("rejectedBy");
const actionTakenBy = new ECS.Component<UserID[]>("actionTakenBy");

ECS.clearComponentNamespace();

function messageToEntity(m : Discord.Message, initialize : boolean = true) : ECS.Entity {
	// snowflakes are unique across Discord, so using them as entity IDs is fine
	let e = new ECS.Entity(m.id);
	if (initialize && !e.has(message)) e.set(message, flattenMessage(m));
	return e;
}

function getChannel(id : string) : Discord.TextChannel | undefined {
	let channel = client.channels.get(id);
	if (!(channel instanceof Discord.TextChannel))
		return undefined;
	return channel;
}

async function moveMessage(msg : Discord.Message, channelID : string) : Promise<Discord.Message> {
	let destination = getChannel(channelID);
	if (!destination) return msg;
	if (msg.channel instanceof Discord.GuildChannel && destination.equals(msg.channel))
		return msg;
	let content = msg.content;
	let entity = messageToEntity(msg);
	await msg.delete();
	// if the original message was one message, it shouldn't ever send as multiple
	let newMsg = await destination.send(content) as Discord.Message;
	if (entity.has(message)) {
		let newEntity = messageToEntity(newMsg);
		for (let [_, c] of ECS.components) {
			if (c === message) continue;
			if (entity.has(c)) {
				newEntity.set(c, entity.get(c));
				entity.delete(c);
			}
		}
	}
	return newMsg;
}

function findLinks(msg : Discord.Message) : string[] {
	return [msg.content];
}

async function handleVetted(msg : Discord.Message, u : Discord.User) {
	try {
		console.log(`${findLinks(msg)[0]} vetted by ${msg.guild.member(u).displayName}`);
		let newMsg = await moveMessage(msg, config.houseSearch.housesChannel);
		messageToEntity(newMsg).set(vettedBy, [u.id]);
	}
	catch (e) {
		console.exception(e);
	}
}
async function handleReVetted(msg : Discord.Message, u : Discord.User) {
	console.log(`${findLinks(msg)[0]} re-vetted by ${msg.guild.member(u).displayName}`);
	let entity = messageToEntity(msg);
	entity.set(vettedBy, (entity.get(vettedBy) || []).concat(u.id));
}
async function handleRejected(msg : Discord.Message, u : Discord.User) {
	console.log(`${findLinks(msg)[0]} rejected by ${msg.guild.member(u).displayName}`);
	messageToEntity(msg).set(rejectedBy, u.id);
	await moveMessage(msg, config.houseSearch.rejectedChannel);
}
async function handleContacted(msg : Discord.Message, u : Discord.User) {
	console.log(`${findLinks(msg)[0]} contacted by ${msg.guild.member(u).displayName}`);
	messageToEntity(msg).set(contactUser, u.id);
	console.log("Moving to contacted channel...");
	await moveMessage(msg, config.houseSearch.contactedChannel);
	console.log("Moved");
}
async function handleNeedsAction(msg : Discord.Message, u : Discord.User) {
	if (u.id !== messageToEntity(msg).get(contactUser)) {
		console.log(`${u.id} !== ${messageToEntity(msg).get(contactUser)}`);
		console.log(ECS.components);
		return;
	}
	messageToEntity(msg).set(actionTakenBy, []);
	await moveMessage(msg, config.houseSearch.actionNeededChannel);
}
async function handleActionTaken(msg : Discord.Message, u : Discord.User) {
	console.log(`Action taken for ${findLinks(msg)[0]} by ${msg.guild.member(u).displayName}`);
	let entity = messageToEntity(msg);
	if (!entity.get(actionTakenBy)!.includes(u.id)) {
		entity.set(actionTakenBy, entity.get(actionTakenBy)!.concat(u.id));
	}
	if (msg.guild.roles
		.get(config.houseSearch.actionNeededFromRole)!
		.members.every(m => entity.get(actionTakenBy)!.includes(m.id)))
	{
		await handleActionNotNeeded(msg, await client
			.fetchUser(messageToEntity(msg).get(contactUser)!));
	}
}
async function handleActionNotNeeded(msg : Discord.Message, u : Discord.User) {
	if (u.id !== messageToEntity(msg).get(contactUser)) return;
	messageToEntity(msg).delete(actionTakenBy);
	await moveMessage(msg, config.houseSearch.contactedChannel);
}

Reactor.addHandlers(config.houseSearch.listingsChannel, [
	[config.houseSearch.vettedReact, handleVetted],
	[config.houseSearch.rejectedReact, handleRejected],
]);
Reactor.addHandlers(config.houseSearch.housesChannel, [
	[config.houseSearch.vettedReact, handleReVetted],
	[config.houseSearch.contactedReact, handleContacted],
	[config.houseSearch.rejectedReact, handleRejected],
]);
Reactor.addHandlers(config.houseSearch.contactedChannel, [
	[config.houseSearch.vettedReact, handleReVetted],
	[config.houseSearch.actionNeededReact, handleNeedsAction],
	[config.houseSearch.rejectedReact, handleRejected],
]);
Reactor.addHandlers(config.houseSearch.actionNeededChannel, [
	[config.houseSearch.vettedReact, handleReVetted],
	[config.houseSearch.actionTakenReact, handleActionTaken],
	[config.houseSearch.actionNotNeededReact, handleActionNotNeeded],
	[config.houseSearch.rejectedReact, handleRejected],
]);
*/
