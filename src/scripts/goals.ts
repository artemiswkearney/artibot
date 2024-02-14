import client from "../client.js";
import config from "../config.js";
import * as Discord from 'discord.js';
import * as Reactor from "../reactor.js";
import { promisify } from 'util';

declare module "../config" {
	interface Config {
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
}

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

async function getChannel(channel : string) : Promise<Discord.TextChannel> {
	let c = ((await client.channels.fetch(channel)) as Discord.TextChannel);
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
	let mc = await getChannel(mainChannel);
	let qc = await getChannel(questionChannel);
	await Reactor.addFilteredHandlers(mainChannel, [[config.goals.questionEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, qc)]]);
	await Reactor.addFilteredHandlers(questionChannel, [[config.goals.answeredEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, mc)]]);
}

client.on("ready", async () => {
	let dailyDoneChannel = await getChannel(config.goals.dailyDoneChannel);
	let weeklyDoneChannel = await getChannel(config.goals.weeklyDoneChannel);

	await Reactor.addFilteredHandlers(config.goals.dailyChannel, [
		[config.goals.mustEmote, filterUnprioritizedGoal, prioritizeHandler("!")],
		[config.goals.shouldEmote, filterUnprioritizedGoal, prioritizeHandler("=")],
		[config.goals.niceEmote, filterUnprioritizedGoal, prioritizeHandler("+")],
		[config.goals.doneEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, dailyDoneChannel)]
	]);

	await Reactor.addFilteredHandlers(config.goals.weeklyChannel, [
		[config.goals.mustEmote, filterUnprioritizedGoal, prioritizeHandler("!")],
		[config.goals.shouldEmote, filterUnprioritizedGoal, prioritizeHandler("=")],
		[config.goals.niceEmote, filterUnprioritizedGoal, prioritizeHandler("+")],
		[config.goals.doneEmote, filterPrioritizedGoal, (msg) => moveMessage(msg, weeklyDoneChannel)]
	]);

	await addQuestionHandlers(config.goals.dailyChannel, config.goals.dailyQuestionChannel);
	await addQuestionHandlers(config.goals.weeklyChannel, config.goals.weeklyQuestionChannel);

	await Reactor.addFilteredHandlers(config.goals.proposedChannel, [
		[config.goals.mustEmote, filterUnprioritizedGoal, prioritizeHandler("!")],
		[config.goals.shouldEmote, filterUnprioritizedGoal, prioritizeHandler("=")],
		[config.goals.niceEmote, filterUnprioritizedGoal, prioritizeHandler("+")]
	]);

	let dailyChannel = await getChannel(config.goals.dailyChannel);
	let weeklyChannel = await getChannel(config.goals.weeklyChannel);
	let longTermChannel = await getChannel(config.goals.longTermChannel);

	await Reactor.addHandlers(config.goals.proposedChannel, [
		[config.goals.dailyEmote, (msg) => moveMessage(msg, dailyChannel)],
		[config.goals.weeklyEmote, (msg) => moveMessage(msg, weeklyChannel)],
		[config.goals.longTermEmote, (msg) => moveMessage(msg, longTermChannel)],
	]);

	let longTermDoneChannel = await getChannel(config.goals.longTermDoneChannel);

	await Reactor.addFilteredHandlers(config.goals.longTermChannel, [
		[config.goals.mustEmote, filterUnprioritizedGoal, prioritizeHandler("!")],
		[config.goals.shouldEmote, filterUnprioritizedGoal, prioritizeHandler("=")],
		[config.goals.niceEmote, filterUnprioritizedGoal, prioritizeHandler("+")],
		[config.goals.doneEmote, () => Promise.resolve(true), (msg) => moveMessage(msg, longTermDoneChannel)]
	]);
});
