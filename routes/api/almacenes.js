const router = require("express").Router();
const { getAllAlmacenes } = require('../../models/almacen.model');
const { checkJefeEquipo } = require("../../utils/middlewares");

// GET /api/almacenes
router.get('/jefe', checkJefeEquipo, async(req, res) => {
    try {
        const [result] = await getAllAlmacenes();
        res.json(result);
        console.log(result)
    } catch (error) {
        res.status(503)
            .json({ fatal: error.message });
    }
});

module.exports = router;