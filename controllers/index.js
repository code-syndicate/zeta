function Index(req, res) {
	const context = {
		flash: {
			info: req.flash('info'),
		},
	};
	res.render('index', context);
}

function contact(req, res) {
	const context = {
		flash: {
			info: req.flash('info'),
		},
	};
	res.render('contact', context);
}

function about(req, res) {
	const context = {
		flash: {
			info: req.flash('info'),
		},
	};
	res.render('about', context);
}

function services(req, res) {
	const context = {
		flash: {
			info: req.flash('info'),
		},
	};
	res.render('services', context);
}

module.exports = {
	Index,
	contact,
	about,
	services,
};