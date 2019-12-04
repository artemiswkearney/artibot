import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';

declare module "../config" {
	interface Config {
		atAtEveryone: {
			role : string;
		}
	}
}

client.on('guildMemberAdd', member => {
	member.addRole(config.atAtEveryone.role);
});
