var router = require('express').Router();
var IndexControllers = require('./controllers/index');

// Paths
router.get('/', IndexControllers.Index);

module.exports = router;
