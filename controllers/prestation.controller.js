const Prestation = require("../models/Prestation");

exports.create = (req, res) => {
    const prestation = new Prestation({
        nom: req.body.nom,
        detailPieces: req.body.detailPieces,
        duree: req.body.duree,
        mainOeuvre: req.body.mainOeuvre
    });

    prestation.save((err, prestation) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        res.send({ message: "La prestation a été créée!" });
    });
};

exports.findById = (req, res) => {
    Prestation.findById(req.params.id)
        .populate({
            path: 'detailPieces',
            populate: ['piece', 'marque']
        })
        .exec((err, prestation) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
            res.send(prestation);
        });
};

exports.findAll = (req, res) => {
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    const nameFilter = req.query.name;
    const minDuree = req.query.minDuree;
    const maxDuree = req.query.maxDuree;
    
    let conditions = {};

    if (nameFilter) {
        conditions.nom = { $regex: new RegExp(nameFilter, "i") };
    }

    if (minDuree) {
        conditions.duree = { $gte: minDuree };
    }

    if (maxDuree) {
        if (conditions.duree) {
            conditions.duree.$lte = maxDuree;
        } else {
            conditions.duree = { $lte: maxDuree };
        }
    }

    let query = Prestation.find(conditions)
        .populate({
            path: 'detailPieces',
            populate: ['piece', 'marque']
        });
    let countQuery = Prestation.find(conditions);

    countQuery.countDocuments((err, count) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        const totalPages = Math.ceil(count / size);

        if (page) {
            const limit = size ? size : 10;
            query
                .skip((page - 1) * limit)
                .limit(limit)
                .exec((err, prestations) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                    res.send({ count: count, data: prestations, totalPages: totalPages });
                });
        } else {
            query.exec((err, prestations) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                res.send({ count: count, data: prestations, totalPages: totalPages });
            });
        }
    });
};

exports.update = (req, res) => {
    Prestation.findByIdAndUpdate(
        req.params.id,
        {
            nom: req.body.nom,
            detailPieces: req.body.detailPieces,
            duree: req.body.duree,
            mainOeuvre: req.body.mainOeuvre
        },
        { new: true },
        (err, prestation) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
            res.send({ message: "La prestation a été mise à jour!" });
        }
    );
};

exports.delete = (req, res) => {
    Prestation.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        res.send({ message: "La prestation a été supprimée!" });
    });
};