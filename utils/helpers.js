const dayjs = require("dayjs");
const jwt = require('jsonwebtoken');

const createToken = (user) => {
    const obj = {
        usuario_id: user.id,
        exp_at: dayjs().add(30, 'days').unix()
    }
    return jwt.sign(obj, process.env.SECRET_KEY);
}

module.exports = {
    createToken
}