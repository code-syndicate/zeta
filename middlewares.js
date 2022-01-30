require('dotenv').config();

function context(req, res, next) {
	res.locals.sitename = process.env.SITENAME;
	res.locals.user = req.user || null;
	res.locals.customer = req.user || {
		lastLogin: {},
	};

	if (req.user) {
		if (req.user.gender === 'male') {
			res.locals.avatar = '/user_m.png';
		} else if (req.user.gender === 'female') {
			res.locals.avatar = '/user_f.png';
		}
	} else {
		res.locals.avatar = '/user_m.png';
	}

	next();
}

module.exports = {context};
