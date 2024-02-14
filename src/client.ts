import * as Discord from 'discord.js';
import fs from 'fs';
import util from 'util';
import config from './config.js';

declare module "./config" {
	interface Config {
		token : string;
	}
}

const client = new Discord.Client({
	intents: [
		Discord.IntentsBitField.Flags.Guilds,
		Discord.IntentsBitField.Flags.GuildMessages,
		Discord.IntentsBitField.Flags.GuildMembers,
		Discord.IntentsBitField.Flags.MessageContent,
		Discord.IntentsBitField.Flags.GuildMessageReactions,
		Discord.IntentsBitField.Flags.DirectMessages,
		Discord.IntentsBitField.Flags.DirectMessageReactions,
		Discord.IntentsBitField.Flags.MessageContent,
	],
	partials: [
		Discord.Partials.Message,
		Discord.Partials.Channel,
		Discord.Partials.Reaction,
	],
});

client.on('error', console.error);

client.once('ready', () => {
	console.log("Ready!");
});

const token = config.token;

client.login(token);

export default client;
