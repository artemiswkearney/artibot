import * as Discord from 'discord.js';
import fs from 'fs';
import util from 'util';
import config from './config';

const client = new Discord.Client();

client.on('error', console.error);

client.once('ready', () => {
	console.log("Ready!");
});

const token = config.token;

client.login(token);

export default client;
