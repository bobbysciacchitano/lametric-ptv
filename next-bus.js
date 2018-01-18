const http = require('http');
const crypto = require('crypto');
const moment = require('moment-timezone');

const env = process.env;

const baseUrl      = env.NB_URL;
const routeTypeId  = env.NB_ROUTE_TYPE_ID;
const stopId       = env.NB_STOP_ID;
const devId        = env.NB_DEV_ID;
const devKey       = env.NB_DEV_KEY;
const timezone     = env.NB_TIMEZONE;
const routeNumbers = JSON.parse(env.NB_ROUTES);
const interfaceIcon = 'i5420';

const createSignature = (path) => (
	crypto.createHmac('sha1', devKey)
		.update(path)
		.digest('hex')
);

module.exports = () => (
	new Promise((resolve) => {
		const path = `/v3/departures/route_type/${routeTypeId}/stop/${stopId}?devid=${devId}`;
		const signature = createSignature(path);
		const url = `${baseUrl}${path}&signature=${signature}`;

		http.get(url, res => {
			res.setEncoding('utf8');

			let body = '';

			res.on('data', data => {
				body += data;
			});

			res.on('end', () => {
				body = JSON.parse(body);

				let departures = body.departures.map((departure) => {
					let time = departure.estimated_departure_utc || departure.scheduled_departure_utc;

					return {
						routeId: departure.route_id,
						routeNumber: routeNumbers[departure.route_id],
						time,
						isEstimated: !!departure.estimated_departure_utc,
					};
				}).filter((depature) => {
					return moment(depature.time).isSameOrAfter(moment());
				}).sort((previous, next) => {
					if (moment(previous.time).isBefore(moment(next.time))) {
						return -1;
					}

					if (moment(previous.time).isAfter(moment(next.time))) {
						return 1;
					}

					return 0;
				}).slice(0, 1);

				if (departures.length === 0) {
					resolve({
						frames: [{
							icon: interfaceIcon,
							text: 'No departure information available',
						}],
					});

					return;
				}

				const next = departures[0];
				const countdown = moment(next.time).tz(timezone).fromNow();

				const dataset = {
					frames: [{
						icon: interfaceIcon,
						text: `Next bus ${countdown}`,
					}],
				};

				resolve(dataset);
			});
		});
	})
);
