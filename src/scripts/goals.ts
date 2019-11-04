import client from "../client";
import config from "../config";
import * as Discord from 'discord.js';
import * as Reactor from "../reactor";
import { promisify } from 'util';

const prioritizedGoalRegex = /^[!=\+]/;
const unprioritizedGoalRegex = /^(-*)(-)( .*)/;
const unprioritizedGoalMatchRegex = /^-+ /;

function prioritize(s : string, priority : string) : string {
	return s.replace(unprioritizedGoalRegex, `$1${priority}$3`);
}
async function filterPrioritizedGoal(msg : Discord.Message) {
	return prioritizedGoalRegex.test(msg.content);
}
async function filterUnprioritizedGoal(msg : Discord.Message) {
	return unprioritizedGoalMatchRegex.test(msg.content);
}

function prioritizeHandler(priority : string) : (msg : Discord.Message) => Promise<void> {
	return async (msg) => {
		let content = msg.content;
		let channel = msg.channel;
		await Promise.all([
			msg.delete(),
			channel.send(prioritize(content, priority)),
		]);
	}
}

function getChannel(channel : string) : Discord.TextChannel {
	let c = (client.channels.get(channel) as Discord.TextChannel);
	if (!c) console.log("Couldn't find channel " + channel);
	return c;
}

async function moveMessage(msg : Discord.Message, channel : Discord.TextChannel) {
	let content = msg.content;
	await Promise.all([
		msg.delete(),
		channel.send(content)
	]);
}

async function addQuestionHandlers(mainChannel : string, questionChannel : string) {
	let mc = getChannel(mainChannel);
	let qc = getChannel(questionChannel);
	await Reactor.addFilteredHandlers(mainChannel, [[config.goals.questionEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, qc)]]);
	await Reactor.addFilteredHandlers(questionChannel, [[config.goals.answeredEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, mc)]]);
}

client.on("ready", async () => {
	let dailyDoneChannel = getChannel(config.goals.dailyDoneChannel);
	let weeklyDoneChannel = getChannel(config.goals.weeklyDoneChannel);

	await Reactor.addFilteredHandlers(config.goals.dailyChannel, [
		[config.goals.mustEmote, filterUnprioritizedGoal, prioritizeHandler("!")],
		[config.goals.shouldEmote, filterUnprioritizedGoal, prioritizeHandler("=")],
		[config.goals.niceEmote, filterUnprioritizedGoal, prioritizeHandler("+")],
		[config.goals.doneEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, getChannel(config.goals.dailyDoneChannel))]
	]);

	await Reactor.addFilteredHandlers(config.goals.weeklyChannel, [
		[config.goals.mustEmote, filterUnprioritizedGoal, prioritizeHandler("!")],
		[config.goals.shouldEmote, filterUnprioritizedGoal, prioritizeHandler("=")],
		[config.goals.niceEmote, filterUnprioritizedGoal, prioritizeHandler("+")],
		[config.goals.doneEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, getChannel(config.goals.weeklyDoneChannel))]
	]);

	await addQuestionHandlers(config.goals.dailyChannel, config.goals.dailyQuestionChannel);
	await addQuestionHandlers(config.goals.weeklyChannel, config.goals.weeklyQuestionChannel);

	await Reactor.addFilteredHandlers(config.goals.proposedChannel, [
		[config.goals.mustEmote, filterUnprioritizedGoal, prioritizeHandler("!")],
		[config.goals.shouldEmote, filterUnprioritizedGoal, prioritizeHandler("=")],
		[config.goals.niceEmote, filterUnprioritizedGoal, prioritizeHandler("+")]
	]);

	let dailyChannel = getChannel(config.goals.dailyChannel);
	let weeklyChannel = getChannel(config.goals.weeklyChannel);

	await Reactor.addHandlers(config.goals.proposedChannel, [
		[config.goals.dailyEmote, (msg) => moveMessage(msg, dailyChannel)],
		[config.goals.weeklyEmote, (msg) => moveMessage(msg, weeklyChannel)],
	]);
});
