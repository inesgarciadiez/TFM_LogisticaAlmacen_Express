//const dayjs = require("dayjs");
const jwt = require('jsonwebtoken');

const createToken = (user) => {
    const obj = {
        user_id: user.id,
        user_role: user.role,
        //exp_at: dayjs().add(5, 'minutes').unix()
    }
    return jwt.sign(obj, 'en un lugar de la mancha');
}

module.exports = {
    createToken
}