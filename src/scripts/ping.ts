import client from "../client.js";
import * as Discord from 'discord.js';

// A basic ping command.
// When you type !ping in any channel the bot can see, it'll reply with "Pong!", then check the difference between the message's timestamps to work out the total delay in the bot's responses.

client.on('messageCreate', msg => {
	if (msg.partial) return;
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
