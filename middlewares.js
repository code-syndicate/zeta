require('dotenv').config();
var {Notification} = require('./models/transactions');
var numeral = require('numeral');

async function context(req, res, next) {
	res.locals.sitename = process.env.SITENAME;
	res.locals.ref3 = false;
	res.locals.numeral = function (number) {
		return numeral(number).format('0,0.00');
	};
	res.locals.user = req.user || null;
	res.locals.customer = req.user || {
		lastLogin: {},
	};

	if (req.isAuthenticated()) {


			const notifications = await Notification.find({
				listener: req.user._id,
				status: 'unread',
			})
				.lean()
				.exec();

			const updates = notifications.length;

			res.locals.updatesCount = updates === 0 ? '' : updates;
			res.locals.notifications = notifications;

		if (req.user.gender === 'male') {
			res.locals.avatar = '/user_m.png';
		} else if (req.user.gender === 'female') {
			res.locals.avatar = '/user_f.png';
		}
	} else {
		res.locals.avatar = '/user_m.png';
		res.locals.updatesCount = 0;
	}

	next();
}

module.exports = {context};
