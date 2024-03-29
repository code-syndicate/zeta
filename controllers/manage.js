var Customer3 = require("./../models/customer");
var { Debit3, Credit3, Notification3 } = require("./../models/transactions");
var { body, validationResult } = require("express-validator");

async function debitAccessControl(req, res) {
  const dId = req.params.id;
  const action = req.params.action;

  if (action !== "approve" && action !== "revoke") {
    res.status(303).redirect("/manage/home?view=debits");
    return;
  } else {
    const debit = await Debit3.findById(dId).exec();

    const client = await Customer3.findOne({
      _id: debit.beneficiary,
    }).exec();

    if (client.getBalance() < debit.amount) {
      req.flash(
        "info",
        "Client has insufficient balance, please credit client first"
      );
      res.status(303).redirect("/manage/home?view=debits");
      return;
    }

    if (action === "approve") {
      debit.approved = true;
      client.totalDebit += debit.amount;
      await new Notification3({
        listener: client._id,
        description: `Debit of $${debit.amount} has been approved`,
      }).save();
    } else if (action === "revoke") {
      debit.approved = false;
      client.totalDebit -= debit.amount;
      await new Notification3({
        listener: client._id,
        description: `Debit of $${debit.amount} has been revoked`,
      }).save();
    }

    req.flash("info", `Debit ${action}d successfully`);

    await debit.save();
    await client.save();
    res.status(303).redirect("/manage/home?view=debits");
  }
}

async function accessControl(req, res) {
  const uId = req.params.id;
  const action = req.params.action;

  if (action !== "activate" && action !== "deactivate") {
    res.status(303).redirect("/manage/home?view=customers");
    return;
  } else {
    const client = await Customer3.findById(uId).exec();

    if (action === "activate") {
      client.disabled = false;
    } else if (action === "deactivate") {
      client.disabled = true;
    }

    req.flash("info", `Client ${action}d successfully`);

    await client.save();
    res.status(303).redirect("/manage/home?view=customers");
  }
}

async function deleteUser(req, res) {
  const userId = req.params.id || null;
  await Debit3.deleteMany({ issuer: userId }).exec();
  await Credit3.deleteMany({ destination: userId }).exec();

  await Customer3.deleteOne({ _id: userId }).exec();

  res.status(306).redirect("/manage/home?view=customers");
}

async function deleteCredit(req, res) {
  const creditId = req.params.id || null;
  await Credit3.deleteOne({ _id: creditId }).exec();

  res.status(306).redirect("/manage/home?view=credits");
}

async function deleteDebit(req, res) {
  const debitId = req.params.id || null;
  await Debit3.deleteOne({ _id: debitId }).exec();

  res.status(306).redirect("/manage/home?view=debits");
}

const addCredit = [
  body("email", "Email is required")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("timestamp", "Timestamp is required").trim().toDate(),
  body("title", "Credit title is required")
    .trim()
    .isLength({ min: 3, max: 512 }),
  body("amount", "Amount is required")
    .trim()
    .isNumeric()
    .withMessage("Please enter a valid amount")
    .toFloat(),
  body("email").custom(async (inputValue) => {
    const userExists = await Customer3.exists({ email: inputValue });

    if (!userExists) {
      throw Error("No client exists with such email, try again.");
    }

    return true;
  }),

  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("formErrors", errors.array());
      req.flash("info", "Errors in form, please fill properly and try again");
      res.status(303).redirect("/manage/home?view=credits&form=true");
    } else {
      const client = await Customer3.findOne({
        email: req.body.email,
      }).exec();
      // client.balance += req.body.amount;
      client.totalCredit += req.body.amount;
      // console.log(req.body.timestamp);
      await new Credit3({
        issuer: req.user._id,
        amount: req.body.amount,
        title: req.body.title,
        description: `Received a credit of $${req.body.amount}`,
        destination: client._id,
        timestamp: req.body.timestamp,
      }).save();

      await new Notification3({
        listener: client._id,
        description: `Credit - ${req.body.title} : $${req.body.amount}`,
      }).save();
      await client.save();
      req.flash("info", "Client credited successfully");
      res.status(303).redirect("/manage/home?view=credits");
    }
  },
];

const addDebit = [
  body("email", "Email is required")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("timestamp", "Timestamp is required").trim().toDate(),
  body("title", "Credit title is required")
    .trim()
    .isLength({ min: 3, max: 512 }),
  body("accountNumber", "Account number is required")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Please enter a valid account number"),
  body("bankName", "Bank name  is required")
    .trim()
    .isLength({ min: 8, max: 512 }),
  body("amount", "Amount is required")
    .trim()
    .isNumeric()
    .withMessage("Please enter a valid amount")
    .toFloat(),
  body("email").custom(async (inputValue) => {
    const userExists = await Customer3.exists({ email: inputValue });

    if (!userExists) {
      throw Error("No client exists with such email, try again.");
    }

    return true;
  }),

  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("formErrors", errors.array());
      req.flash("info", "Errors in form, please fill properly and try again");
      res.status(303).redirect("/manage/home?view=debits&form=true");
    } else {
      const client = await Customer3.findOne({
        email: req.body.email,
      }).exec();

      // console.log(req.body.timestamp);
      await new Debit3({
        issuer: req.user._id,
        beneficiary: client._id,
        amount: req.body.amount,
        title: req.body.title,
        description: `Debit - ${req.body.title} : $${req.body.amount}`,
        destination: {
          accountNumber: req.body.accountNumber,
          bankName: req.body.bankName,
        },
        timestamp: req.body.timestamp,
      }).save();

      await new Notification3({
        listener: client._id,
        description: `Debit - ${req.body.title} : $${req.body.amount}`,
        status: "read",
      }).save();
      await client.save();
      req.flash("info", "Debit created successfully");
      res.status(303).redirect("/manage/home?view=debits");
    }
  },
];

const editClient = [
  body("amount", "Balance is required")
    .trim()
    .isNumeric()
    .withMessage("Please enter a valid amount")
    .toFloat(),

  async function (req, res) {
    const client = await Customer3.findById(req.params.id).exec();
    switch (req.method) {
      case "GET":
        const context = {
          client,
        };

        res.render("admin/edit_client", context);
        break;

      case "POST":
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          req.flash("formErrors", errors.array());
          res.status(303).redirect(req.originalUrl);
        } else {
          const newBalance = req.body.amount || client.balance;
          client.balance = newBalance;
          await client.save();
          req.flash("info", "Balance updated successfully");
          res.status(306).redirect("/manage/home?view=customers");
          break;
        }
    }
  },
];

async function home(req, res) {
  const view = req.query.view || "home";
  const showForm = req.query.form || null;

  const options = {
    home: "home",
    customers: "clients",
    credits: "credits",
    debits: "debits",
  };
  let clients = await Customer3.find({}).sort({ email: 1 }).exec();
  clients = clients.map((c) => c.toObject({ virtuals: true }));
  // console.log(clients);
  clients = clients.filter((c) => c.email !== req.user.email);

  let debits = await Debit3.find({})
    .populate("issuer")
    .sort({ timestamp: -1 })
    .lean()
    .exec();
  let credits = await Credit3.find({})
    .populate("issuer")
    .sort({ timestamp: -1 })
    .populate("destination")
    .exec();

  // console.log(debits, credits);

  const context = {
    viewOptions: [options[view]],
    clients,
    debits,
    credits,
    flash: {
      showForm,
      info: req.flash("info"),
      formErrors: req.flash("formErrors"),
    },
  };
  res.render("admin/index", context);
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
  addDebit,
};
