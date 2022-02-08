require('dotenv').config();
var passport = require('passport');
var Customer = require('./../models/customer');
var {body, validationResult} = require('express-validator');
var {Debit, Notification, Credit} = require('../models/transactions');
var {nanoid} = require('nanoid');
var multer = require('multer');
var multerS3 = require('multer-s3');
var aws = require('aws-sdk');

const s3 = new aws.S3({
	credentials: {
		secretAccessKey: process.env.S3_SECRET_KEY,
		accessKeyId: process.env.S3_ACCESS_KEY,
	},
	region: 'af-south-1',
});
const ALLOWED_IMAGE_EXTENSIONS = process.env.ALLOWED_IMAGE_EXTENSIONS;

let storage;
const fileFilter = (req, file, cb) => {
	const extension = file.mimetype.split('/')[1];
	if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
		cb(new Error('Invalid file type, only JPEG and PNG is allowed'), false);
	} else {
		cb(null, true);
	}
};

if (process.env.NODE_ENV === 'development') {
	storage = multer.diskStorage({
		destination: 'public/media',
		filename: function (req, file, cb) {
			const extension = file.mimetype.split('/')[1];
			const fn = nanoid(16);
			cb(null, 'atlantic' + fn + '.' + extension);
		},
	});
} else {
	storage = multerS3({
		s3,
		bucket: 'shared-testing-bucket',
		acl: 'public-read',
		contentType: multerS3.AUTO_CONTENT_TYPE,
		key: function (req, file, cb) {
			const fn = nanoid(16);
			cb(null, 'atlantic' + fn);
		},
	});
}

const photographUpload = multer({
	fileFilter,
	storage,
	limits: {fileSize: 1024 * 1024 * 2},
}).single('photograph');

// amazon ends

async function markAsRead(req, res) {
	await Notification.deleteOne({
		_id: req.params.notificationId,
	}).exec();

	req.flash('info', 'Notification marked as read');
	res.status(306).redirect('/app/home');
}

async function history(req, res) {
	let options = {};

	if (!req.user.isAdmin) {
		options.issuer = req.user._id;
	}
	const debits = await Debit.find(options)
		.populate('issuer')
		.sort({timestamp: -1})
		.limit(20)
		.exec();
	const credits = await Credit.find(options)
		.populate('issuer')
		.populate('destination')
		.sort({timestamp: -1})
		.limit(20)
		.exec();

	const context = {
		ref3: true,
		ref2: null,
		ref1: null,
		debits,
		credits,
		flash: {
			info: req.flash('info'),
		},
	};
	res.render('app_index', context);
}

async function appIndex(req, res) {
	let ref2 = req.query.ref2 || null;

	const validRefs = ['TX'];

	if (!validRefs.includes(ref2)) {
		ref2 = null;
	}

	const flash = {
		formErrors: req.flash('formErrors'),
		info: req.flash('info'),
	};

	const context = {
		ref1: null,
		ref2,
		flash,
		avatar: req.user.gender === 'male' ? '/user_m.png' : '/user_f.png',
	};
	res.render('app_index', context);
}

function logOut(req, res) {
	req.logOut();
	req.flash('info', 'Logged out');
	res.status(306).redirect('/auth/sign-in');
}

const transferPOST = [
	body('amount', 'Amount is required')
		.trim()
		.isNumeric({locale: 'en-GB'})
		.withMessage('Please enter a valid amount to transfer'),
	body('amount').custom(function (inputValue, {req}) {
		if (req.user.getBalance() < inputValue) {
			throw Error('Insufficient funds!');
		}

		if (inputValue < 10) {
			throw Error('Minimum amount for transfer is $10');
		}

		if (req.user.disabled) {
			req.logOut();
			res.status(303).redirect('/app/home');
			return;
		}

		return true;
	}),
	body('accountNumber', 'Account number is required')
		.trim()
		.isNumeric()
		.withMessage('Please enter a valid account number '),

	body('bankName', 'Bank name is required')
		.trim()
		.isLength({min: 3, max: 1024})
		.withMessage('Please enter a recipient bank name'),

	body('beneficiary', 'Beneficiary name is required')
		.trim()
		.isLength({min: 8, max: 120})
		.withMessage('Please enter a full beneficiary name'),

	body('beneficiaryEmail', 'Beneficiary email is required')
		.trim()
		.isEmail()
		.withMessage('Please enter a valid beneficiary email'),

	body('branchName', 'Branch name is required')
		.trim()
		.isLength({min: 3, max: 1024})
		.withMessage('Please enter a valid branch name'),

	body('currency', 'Currency is required')
		.trim()
		.isLength({min: 3, max: 32})
		.withMessage('Please enter a valid currency'),

	// body('bankAddress', 'Bank address is required')
	// 	.trim()
	// 	.isLength({min: 25, max: 1024})
	// 	.withMessage('Please enter a valid address'),

	body('iban', 'Bank IBAN is required')
		.trim()
		.isLength({min: 3})
		.withMessage('Please enter a valid bank IBAN'),

	body('swift', 'Bank SWIFT is required')
		.trim()
		.isLength({min: 3})
		.withMessage('Please enter a valid bank SWIFT'),

	// body('state', 'State is required')
	// 	.trim()
	// 	.isLength({min: 3})
	// 	.withMessage('Please enter a valid state'),

	// body('city', 'City is required')
	// 	.trim()
	// 	.isLength({min: 3})
	// 	.withMessage('Please enter a valid city'),
	// body('country', 'Country is required')
	// 	.trim()
	// 	.isLength({min: 3})
	// 	.withMessage('Please enter a valid country'),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash('formErrors', errors.array());

			res.status(306).redirect('/app/home?ref2=TX');
		} else {
			const newDebit = await new Debit({
				issuer: req.user._id,
				amount: req.body.amount,
				description: `Transfer of $${req.body.amount} to account ${req.body.accountNumber}`,
				destination: {
					accountNumber: req.body.accountNumber,
					// bankAddress: req.body.bankAddress,
					bankName: req.body.bankName,
					accountName: req.body.beneficiary,
					branchName: req.body.branchName,
					currency: req.body.currency,
					bankIban: req.body.iban,
					bankSwift: req.body.swift,
					// bankCity: req.body.city,
					// bankState: req.body.state,
					// bankCountry: req.body.country,
				},
			}).save();

			// req.user.balance -= newDebit.amount;
			// req.user.totalDebit += newDebit.amount;
			await req.user.save();

			await new Notification({
				listener: req.user._id,
				description: `Debit of $${req.body.amount} by account ${req.body.accountNumber}`,
			}).save();

			req.flash(
				'info',
				'Your transfer request is being processed. You will be notified shortly'
			);

			res.status(306).redirect('/app/home');
		}
	},
];

const signInPOST = [
	body('accountId', 'Account ID is required')
		.isLength({min: 6, max: 16})
		.withMessage('Please enter a valid ID'),

	body('accountId').custom(async (inputValue, {req}) => {
		const IdExists = await Customer.exists({accountId: inputValue});

		if (!IdExists) {
			throw Error(`No account is associated with ID '${inputValue}'`);
		}

		const user = await Customer.findOne({accountId: req.body.accountId})
			.lean()
			.exec();

		if (user.disabled) {
			req.flash(
				'info',
				'This account is currently under restrictions, try again later.'
			);

			throw Error('Access denied');
		}

		req.body.email = user.email;

		return true;
	}),

	body('password', 'Password is required')
		.trim()
		.isLength({min: 8, max: 35})
		.withMessage('Password must be 8 characters or more'),

	function (req, res, next) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash('formErrors', errors.array());

			res.status(306).redirect(req.url);
		} else {
			next();
		}
	},

	passport.authenticate('local', {
		failureFlash: 'Invalid login credentials',
		successRedirect: '/app/home',
		failureRedirect: '/auth/sign-in?ref1=SI',
	}),
];

const signUpPOST = [
	function (req, res, next) {
		photographUpload(req, res, function (uploadError) {
			if (uploadError instanceof multer.MulterError) {
				req.flash('formErrors', [{msg: uploadError.message}]);
				req.flash('info', uploadError.message);
				res.status(303).redirect(req.originalUrl);
				return;
			}

			if (uploadError instanceof Error) {
				console.log('\n', uploadError.message);
			}

			next();
		});
	},

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

	body('phone', 'Phone number is required')
		.trim()
		.isMobilePhone()
		.withMessage('Please enter a valid phone number'),

	body('pin', 'PIN is required')
		.isLength({min: 3})
		.withMessage('PIN must be 3 or more characters'),

	body('accountType', 'Account type is required')
		.trim()
		.isLength({min: 4})
		.isString()
		.withMessage('Please choose a valid account type'),

	body('currency', 'Currency is required')
		.isString()
		.withMessage('Please choose a valid currency'),

	body('dob').isDate().withMessage('Please enter a valid date').toDate(),

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

	async function (req, res) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			req.flash('formErrors', errors.array());
			res.status(303).redirect(req.originalUrl);
			return;
		} else {
			let fileUrl;
			if (process.env.NODE_ENV === 'development') {
				fileUrl = req.file ? req.file.path : null;
			} else if (process.env.NODE_ENV === 'production') {
				fileUrl = req.file ? req.file.location : null;
			}
			console.log('\n\n', req.file);
			await Customer.register(
				{
					...req.body,
					avatar: fileUrl,
				},
				req.body.password1
			);

			req.flash('info', 'Client created successfully');

			res.status(303).redirect('/manage/home?view=customers');
		}
	},
];

function signInPage(req, res) {
	let ref1 = req.query.ref1 || null;
	const validRef1 = ['SI'];

	if (!validRef1.includes(ref1)) {
		ref1 = 'SI';
	}

	const flash = {
		formErrors: req.flash('formErrors'),
		info: req.flash('info'),
		error: req.flash('error'),
	};

	const context = {
		ref1,
		ref2: null,
		flash,
	};

	res.render('app_index', context);
}
function signUpPage(req, res) {
	let ref1 = req.query.ref1 || null;
	const validRef1 = ['SU'];

	if (!validRef1.includes(ref1)) {
		ref1 = 'SU';
	}

	const flash = {
		formErrors: req.flash('formErrors'),
		info: req.flash('info'),
	};

	const context = {
		ref1,
		ref2: null,
		flash,
	};
	res.render('admin/add_client', context);
}

module.exports = {
	signUpPOST,
	signInPOST,
	signInPage,
	signUpPage,
	appIndex,
	logOut,
	transferPOST,
	history,
	markAsRead,
};
