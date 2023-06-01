const { checkToken } = require("../utils/middlewares.js");

const router = require('express').Router();

router.use('/almacenes',checkToken, require('./api/almacenes'));

module.exports = router;