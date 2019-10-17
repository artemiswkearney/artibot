import express from 'express';

const server = express();

server.get(/.*/, (req, res) => {
	res.status(200).send("Artibot!");
});

server.listen(process.env.PORT || 8080, () => {
	console.log("Listening for web requests");
});
