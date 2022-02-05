var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var {customAlphabet} = require('nanoid');
const {Debit, Credit} = require('./transactions');

function genAcctNum() {
	const nanoid = customAlphabet('11123456789', 10);
	return nanoid();
}

function genAccountId() {
	const numbersOnly = customAlphabet('0123456789', 5);
	const lettersOnly = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 3);

	return `ATL-${lettersOnly()}${numbersOnly()}`;
}
const customerSchema = mongoose.Schema({
	firstname: String,
	lastname: String,
	dateOfBirth: {type: Date},
	city: {type: String},
	state: {type: String},
	country: {type: String},
	avatar: {type: String},
	gender: {type: String},
	phone: {type: String, required: true},
	email: {type: String, unique: true, required: true, maxLength: 255},
	hasVerifiedEmail: {type: Boolean, default: false},
	dateJoined: {type: Date, default: Date.now},
	disabled: {type: Boolean, default: false},
	isAdmin: {
		type: Boolean,
		default: false,
	},
	pin: {
		type: String,
		required: true,
	},
	accountId: {
		type: String,
		required: true,
		default: genAccountId,
		unique: true,
	},
	accountNumber: {
		type: String,
		minLength: 8,
		maxLength: 15,
		required: true,
		unique: true,
		default: genAcctNum,
	},
	accountType: {type: String, required: true, default: 'savings'},
	currency: {type: String, required: true, default: '&dollar;'},

	totalCredit: {type: Number, min: 0, default: 0},
	totalDebit: {type: Number, min: 0, default: 0},

	lastLogin: {
		type: Date,
		default: Date.now,
	},
});

customerSchema.virtual('balance').get(async function () {
	const debits = await Debit.find({issuer: this._id}).exec();
	const credits = await Credit.find({destination: this._id}).exec();
	let totalCredit = 0;
	let totalDebit = 0;
	// console.log('\n\n', debits, credits);
	for (let item of debits) {
		totalDebit += item.amount;
	}
	for (let item of credits) {
		totalCredit += item.amount;
	}

	console.log(totalCredit - totalDebit);

	this.totalCredit = totalCredit;
	this.totalDebit = totalDebit;

	return totalCredit - totalDebit;

	// return Math.min(0, totalCredit - totalDebit);
});

customerSchema.plugin(passportLocalMongoose, {
	usernameField: 'email',
	lastLoginField: 'lastLogin',
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
