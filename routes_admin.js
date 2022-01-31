var router = require('express').Router();
var controllers = require('./controllers/manage');

router.get('/home', controllers.home);
router.get('/edit-client/:id', controllers.editClient);
router.post('/edit-client/:id', controllers.editClient);
router.post('/add-credit', controllers.addCredit);
router.get('/add-credit', controllers.addCredit);

module.exports = router;
