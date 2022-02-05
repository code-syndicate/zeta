var Customer = require('./../models/customer');
var {Debit, Credit, Notification} = require('./../models/transactions');
var {body, validationResult} = require('express-validator');

async function debitAccessControl(req, res) {
	const dId = req.params.id;
	const action = req.params.action;

	if (action !== 'approve' && action !== 'revoke') {
		res.status(303).redirect('/manage/home?view=debits');
		return;
	} else {
		const debit = await Debit.findById(dId).exec();

		if (action === 'approve') {
			debit.approved = true;
		} else if (action === 'revoke') {
			debit.approved = false;
		}

		req.flash('info', `Debit ${action}d successfully`);

		await debit.save();
		res.status(303).redirect('/manage/home?view=debits');
	}
}

async function accessControl(req, res) {
	const uId = req.params.id;
	const action = req.params.action;

	if (action !== 'activate' && action !== 'deactivate') {
		res.status(303).redirect('/manage/home?view=customers');
		return;
	} else {
		const client = await Customer.findById(uId).exec();

		if (action === 'activate') {
			client.disabled = false;
		} else if (action === 'deactivate') {
			client.disabled = true;
		}

		req.flash('info', `Client ${action}d successfully`);

		await client.save();
		res.status(303).redirect('/manage/home?view=customers');
	}
}

async function deleteUser(req, res) {
	const userId = req.params.id || null;
	await Debit.deleteMany({issuer: userId}).exec();
	await Credit.deleteMany({destination: userId}).exec();

	await Customer.deleteOne({_id: userId}).exec();

	res.status(306).redirect('/manage/home?view=customers');
}

async function deleteCredit(req, res) {
	const creditId = req.params.id || null;
	await Credit.deleteOne({_id: creditId}).exec();

	res.status(306).redirect('/manage/home?view=credits');
}

async function deleteDebit(req, res) {
	const debitId = req.params.id || null;
	await Debit.deleteOne({_id: debitId}).exec();

	res.status(306).redirect('/manage/home?view=debits');
}

const addCredit = [
	body('email', 'Email is required')
		.trim()
		.isEmail()
		.withMessage('Please enter a valid email'),
	body('timestamp', 'Timestamp is required').trim().toDate(),
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
			req.flash(
				'info',
				'Errors in form, please fill properly and try again'
			);
			res.status(303).redirect('/manage/home?view=credits&form=true');
		} else {
			const client = await Customer.findOne({
				email: req.body.email,
			}).exec();
			client.balance += req.body.amount;
			client.totalCredit += req.body.amount;
			console.log(req.body.timestamp);
			await new Credit({
				issuer: req.user._id,
				amount: req.body.amount,
				description: `Received a credit of $${req.body.amount}`,
				destination: client._id,
				timestamp: req.body.timestamp,
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
	let clients = await Customer.find({}).sort({email: 1}).lean().exec();
	clients = clients.filter((c) => c.email !== req.user.email);

	let debits = await Debit.find({})
		.populate('issuer')
		.sort({timestamp: -1})
		.lean()
		.exec();
	let credits = await Credit.find({})
		.populate('issuer')
		.sort({timestamp: -1})
		.populate('destination')
		.exec();

	// console.log(debits, credits);

	const context = {
		viewOptions: [options[view]],
		clients,
		debits,
		credits,
		flash: {
			info: req.flash('info'),
			formErrors: req.flash('formErrors'),
		},
	};
	res.render('admin/index', context);
}

module.exports = {
	home,
	editClient,
	addCredit,
	deleteCredit,
	deleteDebit,
	deleteUser,
	accessControl,
	debitAccessControl,
};
