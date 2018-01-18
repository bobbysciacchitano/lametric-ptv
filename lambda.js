const NextBus = require('next-bus');

exports.handler = (event, context, callback) => {
	NextBus().then((frames) => {
		const response = {
			'statusCode': 200,
			'body': JSON.stringify(frames),
			'isBase64Encoded': false,
		};

		callback(null, response);
	});
};
