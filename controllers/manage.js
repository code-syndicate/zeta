var Customer = require('./../models/customer');
var {Debit, Credit, Notification} = require('./../models/transactions');
var {body, validationResult} = require('express-validator');

const addCredit = [
	body('email', 'Email is required')
		.trim()
		.isEmail()
		.withMessage('Please enter a valid email'),
	body('amount', 'Amount is required')
		.trim()
		.isNumeric()
		.withMessage('Please enter a valid amount')
		.toFloat(),
	body('email').custom(async (inputValue) => {
		const userExists = await Customer.exists({email: inputValue});

		if (!userExists) {
			throw Error('No client exists with such email, try again.');
		}

		return true;
	}),

	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash('formErrors', errors.array());
			res.status(303).redirect('/manage/home?view=credits&form=true');
		} else {
			const client = await Customer.findOne({
				email: req.body.email,
			}).exec();
			client.balance += req.body.amount;
			client.totalCredit += req.body.amount;
			await new Credit({
				issuer: req.user._id,
				amount: req.body.amount,
				description: `Received a credit of $${req.body.amount}`,
				destination: client._id,
			}).save();

			await new Notification({
				listener: client._id,
				description: `Received a credit of $${req.body.amount}`,
			}).save();
			await client.save();
			req.flash('info', 'Client credited successfully');
			res.status(303).redirect('/manage/home?view=credits');
		}
	},
];

const editClient = [
	body('amount', 'Balance is required')
		.trim()
		.isNumeric()
		.withMessage('Please enter a valid amount')
		.toFloat(),

	async function (req, res) {
		const client = await Customer.findById(req.params.id).exec();
		switch (req.method) {
			case 'GET':
				const context = {
					client,
				};

				res.render('admin/edit_client', context);
				break;

			case 'POST':
				const errors = validationResult(req);

				if (!errors.isEmpty()) {
					req.flash('formErrors', errors.array());
					res.status(303).redirect(req.originalUrl);
				} else {
					const newBalance = req.body.amount || client.balance;
					client.balance = newBalance;
					await client.save();
					req.flash('info', 'Balance updated successfully');
					res.status(306).redirect('/manage/home?view=customers');
					break;
				}
		}
	},
];

async function home(req, res) {
	const view = req.query.view || 'home';

	const options = {
		home: 'home',
		customers: 'clients',
		credits: 'credits',
		debits: 'debits',
	};
	let clients = await Customer.find({}).lean().exec();
	clients = clients.filter((c) => c._id != req.user._id);

	let debits = await Debit.find({}).populate('issuer').lean().exec();
	let credits = await Credit.find({})
		.populate('issuer')
		.populate('destination')
		.exec();

	const context = {
		viewOptions: [options[view]],
		clients,
		debits,
		credits,
	};
	res.render('admin/index', context);
}

module.exports = {
	home,
	editClient,
	addCredit,
};
