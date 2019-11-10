import fs from 'fs';
import util from 'util';
import * as jsonfile from 'jsonfile';

interface Config {
	token : string;
	groceries : {
		itemsChannel : string;
		historyChannel : string;
		orderedChannel : string;
		orderedEmote : string;
		boughtEmote : string;
		addToListEmote : string;
		deleteEmote : string;
	}
	shutdownOnUpdate: {
		updateChannel : string;
	}
	saveAndLoadECS: {
		saveChannel : string;
		path : string;
	}
	ecs: {
		gcsBucket : string;
	} | undefined;
	status: {
		statusCommand : string;
	}
	atAtEveryone: {
		role : string;
	}
	houseSearch: {
		listingsChannel : string;
		housesChannel : string;
		contactedChannel : string;
		actionNeededChannel : string;
		rejectedChannel : string;
		vettedReact : string;
		contactedReact : string;
		actionNeededReact : string;
		actionTakenReact : string;
		actionNotNeededReact : string;
		rejectedReact : string;
		actionNeededFromRole : string;
	}
	goals: {
		mustEmote : string;
		shouldEmote : string;
		niceEmote : string;
		doneEmote : string;
		questionEmote : string;
		answeredEmote : string;
		dailyEmote : string;
		weeklyEmote : string;
		longTermEmote : string;
		dailyChannel : string;
		dailyDoneChannel : string;
		dailyQuestionChannel : string;
		weeklyChannel : string;
		weeklyDoneChannel : string;
		weeklyQuestionChannel : string;
		proposedChannel : string;
		longTermChannel : string;
		longTermDoneChannel : string;
	}
}

// const configJson = fs.readFileSync('../config.json', 'utf8') as string;
// const config = JSON.parse(configJson) as Config;
const config = jsonfile.readFileSync('../config.json', 'utf8') as Config;
export default config;
