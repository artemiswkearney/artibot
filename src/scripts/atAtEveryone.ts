import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';

client.on('guildMemberAdd', member => {
	member.addRole(config.atAtEveryone.role);
});
