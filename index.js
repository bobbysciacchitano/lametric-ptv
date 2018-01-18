require('dotenv').config();

const NextBus = require('./next-bus');

NextBus().then((frames) => {
	console.log(frames);
});
