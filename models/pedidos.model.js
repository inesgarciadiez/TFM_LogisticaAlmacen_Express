const getAllPedidos = () => {
    return db.query(`SELECT * FROM pedidos`);
};

module.exports = {
    getAllPedidos,
};