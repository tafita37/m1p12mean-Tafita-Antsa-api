const Marque = require("../models/Marque");
const User = require("../models/User");
const Vehicule = require("../models/Vehicule");

// Créer un véhicule
exports.create = async (req, res) => {
    try {
        // Vérifier si la marque et le propriétaire existent
        const marqueExists = await Marque.findById(req.body.marque);
        if (!marqueExists) {
            return res.status(404).send({ message: "Marque non trouvée" });
        }

        const proprietaireExists = await User.findById(req.body.proprietaire);
        if (!proprietaireExists) {
            return res.status(404).send({ message: "Propriétaire non trouvé" });
        }

        const vehicule = new Vehicule({
            marque: req.body.marque,
            matricule: req.body.matricule,
            proprietaire: req.body.proprietaire,
            modele: req.body.modele,
            annee: req.body.annee
        });

        const savedVehicule = await vehicule.save();
        res.status(201).send({ message: "Le véhicule a été créé!", data: savedVehicule });
    } catch (err) {
        res.status(500).send({ message: "Erreur lors de la création du véhicule", error: err.message });
    }
};

// Trouver un véhicule par ID
exports.findById = async (req, res) => {
    try {
        const vehicule = await Vehicule.findById(req.params.id).populate('marque proprietaire');

        if (!vehicule) {
            return res.status(404).send({ message: "Véhicule non trouvé" });
        }

        res.send(vehicule);
    } catch (err) {
        res.status(500).send({ message: "Erreur lors de la récupération du véhicule", error: err.message });
    }
};

exports.findByUser = async (req, res) => {
    try {
        const vehicules = await Vehicule.find({ proprietaire: req.params.id }).populate('marque proprietaire');
        res.status(200).json(vehicules);
    } catch (error) {
        res.status(400).send({message: "Erreur lors de la recuperation des vehicules", error: error.message});
    }
}

// Récupérer tous les véhicules avec pagination et filtres
exports.findAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const matriculeFilter = req.query.matricule;
        const minAnnee = parseInt(req.query.minAnnee);
        const maxAnnee = parseInt(req.query.maxAnnee);

        let conditions = {};

        if (matriculeFilter) {
            conditions.matricule = { $regex: new RegExp(matriculeFilter, "i") };
        }

        if (!isNaN(minAnnee)) {
            conditions.annee = { $gte: minAnnee };
        }

        if (!isNaN(maxAnnee)) {
            conditions.annee = conditions.annee ? { ...conditions.annee, $lte: maxAnnee } : { $lte: maxAnnee };
        }

        const totalCount = await Vehicule.countDocuments(conditions);
        const totalPages = Math.ceil(totalCount / size);

        const vehicules = await Vehicule.find(conditions)
            .populate('marque proprietaire')
            .skip((page - 1) * size)
            .limit(size);

        res.send({ count: totalCount, data: vehicules, totalPages });
    } catch (err) {
        res.status(500).send({ message: "Erreur lors de la récupération des véhicules", error: err.message });
    }
};

// Mettre à jour un véhicule
exports.update = async (req, res) => {
    try {
        if (req.body.marque) {
            const marqueExists = await Marque.findById(req.body.marque);
            if (!marqueExists) {
                return res.status(404).send({ message: "Marque non trouvée" });
            }
        }

        if (req.body.proprietaire) {
            const proprietaireExists = await User.findById(req.body.proprietaire);
            if (!proprietaireExists) {
                return res.status(404).send({ message: "Propriétaire non trouvé" });
            }
        }

        const vehicule = await Vehicule.findByIdAndUpdate(req.params.id, {
            marque: req.body.marque,
            matricule: req.body.matricule,
            proprietaire: req.body.proprietaire,
            modele: req.body.modele,
            annee: req.body.annee
        }, { new: true, runValidators: true });

        if (!vehicule) {
            return res.status(404).send({ message: "Véhicule non trouvé" });
        }

        res.send({ message: "Le véhicule a été mis à jour!", data: vehicule });
    } catch (err) {
        res.status(500).send({ message: "Erreur lors de la mise à jour du véhicule", error: err.message });
    }
};

// Supprimer un véhicule
exports.delete = async (req, res) => {
    try {
        const vehicule = await Vehicule.findByIdAndDelete(req.params.id);

        if (!vehicule) {
            return res.status(404).send({ message: "Véhicule non trouvé" });
        }

        res.send({ message: "Le véhicule a été supprimé!" });
    } catch (err) {
        res.status(500).send({ message: "Erreur lors de la suppression du véhicule", error: err.message });
    }
};
