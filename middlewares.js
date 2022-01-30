require('dotenv').config();
var {Notification} = require('./models/transactions');

async function context(req, res, next) {
	res.locals.sitename = process.env.SITENAME;
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

		 = updates.length === 0 ? '' : updates.length;

		if (req.user.gender === 'male') {
			res.locals.avatar = '/user_m.png';
		} else if (req.user.gender === 'female') {
			res.locals.avatar = '/user_f.res.locals.updatesCountpng';
		}
	} else {
		res.locals.avatar = '/user_m.png';
		res.locals.updatesCount = 0;
	}

	next();
}

module.exports = {context};
