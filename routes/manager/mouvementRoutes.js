const Mouvement = require("../../models/Mouvement");
const express = require("express");
const router = express.Router();


router.post('/newMouvement', async (req, res) => {
    try {
        const data = req.body;
        const mouvement = new Mouvement({
            detailPiece: data.detailPiece,
            utilisateur: data.utilisateur,
            fournisseur: data.fournisseur,
            prix: data.prix,
            nb: data.nb,
            isEntree: data.isEntree,
            dateMouvement: data.dateMouvement
        });
        await mouvement.save();
        return res.status(201).json({ message: "Mouvement inséré." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur." });
    }
});

module.exports = router;