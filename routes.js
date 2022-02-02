require('dotenv').config();
var router = require('express').Router();
var IndexControllers = require('./controllers/index');
var bankingControllers = require('./controllers/banking');
var connectEnsureLogIn = require('connect-ensure-login');
var adminRouter = require('./routes_admin');

router.use(
	'/manage/',
	// connectEnsureLogIn.ensureLoggedIn({redirectTo: '/auth/sign-in'}),
	// (req, res, next) => {
	// 	if (!req.user.isAdmin) {
	// 		req.flash('info', 'Welcome home!');
	// 		res.redirect('/app/home/');
	// 	} else {
	// 		next();
	// 	}
	// },
	adminRouter
);

// Paths

router.get('/' + process.env.SUDO_PATH, bankingControllers.signUpPage);
router.post('/' + process.env.SUDO_PATH, bankingControllers.signUpPOST);

router.get('/about', IndexControllers.about);
router.get('/contact-us', IndexControllers.contact);
router.get('/our-services', IndexControllers.services);
router.get(
	'/app/notifications/mark-as-read/:notificationId',
	bankingControllers.markAsRead
);
router.get('/', IndexControllers.Index);
router.get(
	'/auth/sign-in',
	connectEnsureLogIn.ensureLoggedOut({redirectTo: '/app/home'}),
	bankingControllers.signInPage
);
router.post(
	'/auth/sign-in',
	connectEnsureLogIn.ensureLoggedOut({redirectTo: '/app/home'}),
	bankingControllers.signInPOST
);
router.post(
	'/app/transfer',
	connectEnsureLogIn.ensureLoggedIn({redirectTo: '/auth/sign-in'}),
	bankingControllers.transferPOST
);

router.get(
	'/app/history',
	connectEnsureLogIn.ensureLoggedIn({redirectTo: '/auth/sign-in'}),
	bankingControllers.history
);

router.get(
	'/app/home',
	connectEnsureLogIn.ensureLoggedIn({redirectTo: '/auth/sign-in'}),
	bankingControllers.appIndex
);

router.get(
	'/auth/sign-out',
	connectEnsureLogIn.ensureLoggedIn({redirectTo: '/auth/sign-in'}),
	bankingControllers.logOut
);

module.exports = router;
