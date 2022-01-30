var router = require('express').Router();
var IndexControllers = require('./controllers/index');
var bankingControllers = require('./controllers/banking');
var connectEnsureLogIn = require('connect-ensure-login');

// Paths

router.get('/about', IndexControllers.about);
router.get('/contact-us', IndexControllers.contact);
router.get('/our-services', IndexControllers.services);

router.get('/', IndexControllers.Index);
router.get(
	'/auth/sign-in',
	connectEnsureLogIn.ensureLoggedOut({redirectTo: '/app/home'}),
	bankingControllers.signInPage
);
router.get('/auth/sign-up', bankingControllers.signUpPage);
router.post(
	'/auth/sign-in',
	connectEnsureLogIn.ensureLoggedOut({redirectTo: '/app/home'}),
	bankingControllers.signInPOST
);
router.post('/auth/sign-up', bankingControllers.signUpPOST);
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

router.get('/d', bankingControllers.appIndex);

module.exports = router;
