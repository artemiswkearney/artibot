import "./client";
import fs from 'fs';
import "./webserver";

for (let file of fs.readdirSync("./scripts").filter(file => file.endsWith(".ts") || file.endsWith(".js"))) {
	require(`./scripts/${file}`);
}
