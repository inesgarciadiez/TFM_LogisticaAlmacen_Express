const getAllAlmacenes = () => {
    return db.query(`SELECT * FROM almacenes`);
};

module.exports = {
    getAllAlmacenes,
};