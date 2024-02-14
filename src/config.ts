import fs from 'fs';
import util from 'util';
import jsonfile from 'jsonfile';

// the interface is declared empty here, but extended by each script that uses the config
/* use this to extend it in yours:

declare module "../config" {
	interface Config {
	}
}

*/

interface Config {}

// const configJson = fs.readFileSync('../config.json', 'utf8') as string;
// const config = JSON.parse(configJson) as Config;
const config = jsonfile.readFileSync('../config.json', 'utf8') as Config;
export default config;
export { Config };
