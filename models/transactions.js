var mongoose = require("mongoose");
var { customAlphabet } = require("nanoid");

function genTxRef() {
  return "TX-" + customAlphabet("123456789ABCDEFG", 16)();
}

const debitSchema = mongoose.Schema({
  issuer: { type: mongoose.Types.ObjectId, ref: "Customer3", required: true },
  amount: { type: Number, min: 0, required: true },
  ref: { type: String, default: genTxRef, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String },
  approved: { type: Boolean, default: false },
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
    },
    // bankAddress: {type: String, required: true},
    branchName: { type: String, required: true },
    bankName: { type: String, required: true },

    currency: { type: String, required: true },
    bankIban: { type: String, required: true },
    bankSwift: { type: String, required: true },
    // bankCity: {type: String, required: true},
    // bankState: {type: String, required: true},
    // bankCountry: {type: String},
  },
});

const creditSchema = mongoose.Schema({
  issuer: { type: mongoose.Types.ObjectId, ref: "Customer3", required: true },
  amount: { type: Number, min: 0, required: true },
  title: { type: String, default: "" },
  ref: { type: String, default: genTxRef, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String },
  destination: {
    type: mongoose.Types.ObjectId,
    ref: "Customer3",
    required: true,
  },
});

const notificationSchema = mongoose.Schema({
  listener: { type: mongoose.Types.ObjectId, ref: "Customer3", required: true },
  description: { type: String, required: true },
  status: { type: String, default: "unread" },
  timestamp: { type: Date, default: Date.now() },
});

const Debit3 = mongoose.model("Debit3", debitSchema);
const Credit3 = mongoose.model("Credit3", creditSchema);
const Notification3 = mongoose.model("Notification3", notificationSchema);

module.exports = {
  Debit3,
  Credit3,
  Notification3,
};
