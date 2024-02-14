import client from "../client.js";
import config from "../config.js";
import * as Discord from 'discord.js';

declare module "../config" {
	interface Config {
		atAtEveryone: {
			role : string;
		}
	}
}

client.on('guildMemberAdd', member => {
	member.roles.add(config.atAtEveryone.role);
});
