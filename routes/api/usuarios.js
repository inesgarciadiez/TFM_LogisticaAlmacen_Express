const router = require('express').Router();
const bcrypt = require('bcryptjs');

const { getByEmail } = require('../../models/usuario.model');
const { createToken } = require('../../utils/helpers');

router.post('/login', async (req, res) => {
    // ¿Existe el email en la base de datos?
    const [users] = await getByEmail(req.body.email);

    if (users.length === 0) {
        return res.json({ fatal: 'Error en email y/o contraseña' });
    }

    // Recuperamos el usuario
    const user = users[0];

    console.log(req.body.password, user.contraseña);
    // ¿Coinciden las password?
    const iguales = bcrypt.compareSync(req.body.password, user.contraseña);
    if (!iguales) {
        return res.json({ fatal: 'Error en email y/o contraseña' });
    }

    res.json({
        success: 'Login correcto',
        token: createToken(user)
    });

});

module.exports = router;