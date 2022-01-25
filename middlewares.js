require('dotenv').config();
var router = require('express').Router();

function context(req, res, next) {
	res.locals.sitename = process.env.SITENAME;
	res.locals.user = req.user || null;

	next();
}

router.use(context);

module.exports = router;
