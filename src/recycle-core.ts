import client from "./client";
import config from "./config";
import * as Discord from 'discord.js';

import "./scripts/shutdown-on-update";

declare module "./config" {
	interface Config {
		recycle: {
			channel: string;
			pingRole: string;
			admins: string[];
			currentMode: string;
		}
	}
}

require(`./scripts/${config.recycle.currentMode}`);
