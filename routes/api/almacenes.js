const router = require("express").Router();

const { getAllAlmacenes } = require('../../models/almacenes.model');


// GET /api/almacenes
router.get('/almacenes', async(req, res) => {
    try {
        const [result] = await getAllAlmacenes();
        res.json(result);
    } catch (error) {
        res.json({ fatal: error.message });
    }
});

module.exports = router;