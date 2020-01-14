/* Matchstick, a one-file library for RegExp-based pattern matching */
type MatchPair = [RegExp, (_: RegExpMatchArray, ...args: string[]) => any];

/* A curried function.
 * First application: Takes any number of [RegExp, callback] pairs.
 * Second application: Takes a string,
 * Checks the string against each RegExp, then calls the callback of the first matching one.
 * The first argument to the callback is the returned RegExpMatchArray.
 * All unnamed capture groups' contents are passed in order as the remaining arguments.
 */
const match = (...pairs: MatchPair[]) => (str : string) => {
	for (let [rx, f] of pairs) {
		let match : RegExpMatchArray | null = rx.exec(str);
		if (!match) continue;
		return f(match, ...match.slice(1));
	}
}

export { match };
