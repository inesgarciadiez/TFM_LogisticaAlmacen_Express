const router = require("express").Router();

const { getAllAlmacenes } = require('../../models/almacenes.model');
const { checkJefe } = require("../../utils/middlewares");


// GET /api/almacenes
router.get('/jefe',checkJefe, async(req, res) => {
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