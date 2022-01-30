require('dotenv').config();
var {connect} = require('mongoose');

module.exports = function () {
	connect(process.env.DATABASE_URL)
		.then(() => {
			console.log('\n Database connected');
		})
		.catch((err) => {
			console.log('\nError reaching DB -> ', err.message);
		});
};
