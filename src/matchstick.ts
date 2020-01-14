type MatchPair = [RegExp, (_: RegExpMatchArray, ...args: string[]) => any];

const match = (...pairs: MatchPair[]) => (str : string) => {
	for (let [rx, f] of pairs) {
		if (!rx.test(str)) continue;
		let match : RegExpMatchArray = rx.exec(str)!;
		f(match, ...match.slice(1));
	}
}

export { match };
