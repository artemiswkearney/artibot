import "./client.js";
import fs from 'fs';
import "./webserver.js";

for (let file of fs.readdirSync("./scripts").filter(file => file.endsWith(".ts") || file.endsWith(".js"))) {
	import(`./scripts/${file}`);
}
