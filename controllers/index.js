function Index(req, res) {
	res.render('index');
}



function logOut(req, res) {
	req.logout();

	res.status(306).redirect('/');
}

module.exports = {
	Index,
};