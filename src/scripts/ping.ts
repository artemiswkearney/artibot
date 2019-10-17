import client from "../client";
import * as Discord from 'discord.js';

client.on('message', msg => {
	if (msg.author.bot) return;
	if (msg.content === "!ping") {
		msg.channel.send("Pong!")
			.then(ourMsg => {
				let firstMsg : Discord.Message;
				if (ourMsg instanceof Discord.Message) firstMsg = ourMsg;
				else firstMsg = ourMsg[0];

				let ping = firstMsg.createdTimestamp - msg.createdTimestamp;

				firstMsg.edit(`Pong!\nPing: ${ping}ms`);
			});
	}
});
