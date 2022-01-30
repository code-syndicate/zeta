require('dotenv').config();
var {Notification} = require('./models/transactions');
var numeral = require('numeral');

async function context(req, res, next) {
	res.locals.sitename = process.env.SITENAME;
	res.locals.numeral = function (number) {
		return numeral(number).format('0,0.00');
	};
	res.locals.user = req.user || null;
	res.locals.customer = req.user || {
		lastLogin: {},
	};

	if (req.isAuthenticated()) {
		const updates = await Notification.find({
			status: 'unread',
			listener: req.user,
		})
			.lean()
			.exec();

		res.locals.updatesCount = updates.length === 0 ? '' : updates.length;

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
