var mongoose = require('mongoose');
var {nanoid} = require('nanoid');

function genTxRef() {
	return nanoid(24);
}

const debitSchema = mongoose.Schema({
	issuer: {type: mongoose.Types.ObjectId, ref: 'Customer', required: true},
	amount: {type: Number, min: 0, required: true},
	ref: {type: String, default: genTxRef, required: true},
	timestamp: {type: Date, default: Date.now},
	description: {type: String},
	destination: {
		accountNumber: {
			type: String,
			minLength: 8,
			maxLength: 20,
			required: true,
		},
		accountName: {
			type: String,
			minLength: 6,
			required: true,
		},
		bankAddress: {type: String, required: true},
		bankIban: {type: string, required: true},
		bankSwift: {type: string, required: true},
		bankCity: {type: string, required: true},
		bankState: {type: string, required: true},
		bankCountry: {type: string},
	},
});

const creditSchema = mongoose.Schema({
	issuer: {type: mongoose.Types.ObjectId, ref: 'Customer', required: true},
	amount: {type: Number, min: 0, required: true},
	ref: {type: String, default: genTxRef, required: true},
	timestamp: {type: Date, default: Date.now},
	description: {type: String},
	destination: {
		type: mongoose.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
});

const Debit = mongoose.model('Debit', debitSchema);
const Credit = mongoose.model('Credit', creditSchema);

module.exports = {
	Debit,
	Credit,
};
