var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

const customerSchema = mongoose.Schema({
	firstname: String,
	lastname: String,
	dateOfBirth: {type: Date},
	city: {type: String},
	state: {type: String},
	country: {type: String},
	avatar: {type: String, unique: true},
	email: {type: String, unique: true, required: true, maxLength: 255},
	hasVerifiedEmail: {type: Boolean, default: false},
	dateJoined: {type: Date, default: Date.now},
	accountNumber: {
		type: String,
		minLength: 8,
		maxLength: 15,
		required: true,
		unique: true,
	},
	balance: {type: Number, min: 0, default: 0},
});

customerSchema.plugin(passportLocalMongoose);

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
