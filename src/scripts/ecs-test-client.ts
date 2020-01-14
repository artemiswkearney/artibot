import * as ECS from '../ecs';
import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import { match } from '../matchstick';
// import * as Reactor from "../reactor";

declare module "../config" {
	interface Config {
		ecsTestClient: {
			channel: string;
		}
	}
}

client.on('message', msg => {
	if (msg.channel.id !== config.ecsTestClient.channel) return;
	console.log(msg.content);
	match(
		[/^get (\d+) (\d+)/, (_, es, cs) => {
			let e = new ECS.Entity(es);
			let c = new ECS.Component(cs);
			msg.channel.send(e.get(c) || "null");
		}],
		[/^set (\d+) (\d+) (.*)/, (_, es, cs, value) => {
			let e = new ECS.Entity(es);
			let c = new ECS.Component(cs);
			e.set(c, value);
		}],
	)(msg.content);
});
