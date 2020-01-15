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
		[/^get ([^ ]+) ([^ ]+)/, (_, es, cs) => {
			let e = new ECS.Entity(es);
			let c = new ECS.Component(cs);
			msg.channel.send(e.get(c) || "null");
		}],
		[/^set ([^ ]+) ([^ ]+) (.*)/, (_, es, cs, value) => {
			let e = new ECS.Entity(es);
			let c = new ECS.Component(cs);
			e.set(c, value);
			msg.channel.send("Set.");
		}],
		[/^show/, () => {
			let output = "```js\n{\n";
			for (let [id, com] of ECS.components) {
				output += `  '${id}': {
`;
				for (let [ent, val] of com.values) {
					output += `    '${ent}': ${val},
`;
				}
				output += "  },\n";
			}
			output += "}";
			msg.channel.send(output);
		}],
		[/^delete ([^ ]+) ([^ ]+)/, (_, es, cs) => {
			let e = new ECS.Entity(es);
			let c = new ECS.Component(cs);
			if (e.has(c)) {
				e.set(c, undefined);
				e.delete(c);
				msg.channel.send("Deleted.");
			}
			else {
				msg.channel.send("That entity does not have that component to delete!");
			}
		}],
		[/delcomponent ([^ ]+)/, (_, cs) => {
			ECS.components.delete(new ECS.Component(cs).id);
			msg.channel.send("Component deleted.");
		}],
	)(msg.content);
});
