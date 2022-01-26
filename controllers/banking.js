var passport = require('passport');
var Customer = require('./../models/customer');
require('dotenv').config();
var {body, validationResult} = require('express-validator');

function appIndex(req, res) {
	res.render('app_index');
}

function logOut(req, res) {
	req.logOut();
	req.flash('info', 'Logged out');
	res.status(306).redirect('/auth/sign-in');
}

const signInPOST = [
	body('email', 'Email address is required')
		.trim()
		.isEmail()
		.withMessage('Please enter a valid email address'),

	body('password', 'Password is required')
		.isLength({min: 8, max: 35})
		.withMessage('Password must be 8 characters or more'),

	function (req, res, next) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash('formErrors', errors.array());

			res.status(306).redirect(req.originalUrl);
		} else {
			next();
		}
	},

	passport.authenticate('local', {
		failureFlash: 'Invalid login credentials',
		successRedirect: '/app/home',
		failureRedirect: '/auth/sign-in',
	}),
];

const signUpPOST = [
	body('firstname', 'Firstname is required')
		.trim()
		.isLength({min: 3, max: 25})
		.withMessage('Please enter a valid firstname'),

	body('lastname', 'Lastname is required')
		.trim()
		.isLength({min: 3, max: 25})
		.withMessage('Please enter a valid lastname'),

	body('email', 'Email is required')
		.trim()
		.isEmail()
		.withMessage('Please enter a valid email'),

	body('dateOfBirth').isDate().withMessage('Please enter a valid date'),

	body('state', 'State is required')
		.trim()
		.isLength({min: 3})
		.withMessage('Please enter a valid state'),

	body('city', 'City is required')
		.trim()
		.isLength({min: 3})
		.withMessage('Please enter a valid city'),
	body('country', 'Country is required')
		.trim()
		.isLength({min: 3})
		.withMessage('Please enter a valid country'),

	body('password1', 'Password is required')
		.isLength({min: 8, max: 35})
		.withMessage('Password must be 8 or more characters'),

	body('password2', 'Password confirmation is required')
		.isLength({min: 8, max: 35})
		.withMessage('Password must be 8 or more characters'),

	body('password2').custom(function (inputValue, {req}) {
		if (req.body.password1 !== inputValue) {
			throw Error('Password fields did not match');
		}

		return true;
	}),

	body('email').custom(async function (inputValue) {
		const emailExists = await Customer.exists({email: inputValue});

		if (emailExists) {
			throw Error('This email exists already');
		}

		return true;
	}),
	function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash('formErrors', errors.array());
		} else {
			Customer.register(
				{
					...req.body,
				},
				req.body.password1
			);

			req.flash('info', 'Please sign in with your credentials');

			res.status(306).redirect('/auth/sign-in');
		}
	},
];

function signInPage(req, res) {
	res.render('sign_in');
}
function signUpPage(req, res) {
	res.render('sign_up');
}

module.exports = {
	signUpPOST,
	signInPOST,
	signInPage,
	signUpPage,
	appIndex,
	logOut,
};
