const express = require("express");
const User = require("../../models/User");
const TypeClient = require("../../models/TypeClient");
const Mecanicien = require("../../models/Mecanicien");
const Client = require("../../models/Client");
const router = express.Router();

// Liste des utilisateurs
router.get("/allUser", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await User.countDocuments({
      dateSuppression: null,
      dateValidation: { $ne: null },
    });
    const listUser = await User.find({
      dateSuppression: null,
      dateValidation: { $ne: null },
    })
      .skip(skip)
      .limit(size)
      .select("-mdp")
      .populate([
        { path: "role" },
        {
          path: "client",
          // populate: {
          //   path: "typeClient", // Récupérer aussi la table TypeClient
          // },
        }, // Assure-toi que le champ virtuel `client` est bien défini
        { path: "mecanicien" }, // Assure-toi que le champ virtuel `client` est bien défini
      ]);
    const listTypeClients = await TypeClient.find();
    return res
      .status(200)
      .json({ users: listUser, nbUser: total, typeClients: listTypeClients });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Update de pièces
router.post("/update", async (req, res) => {
  try {
    const idUser = req.body.idUser;
    const nom = req.body.nom;
    const prenom = req.body.prenom;
    const email = req.body.email;
    const dateEmbauche = req.body.other.dateEmbauche;
    const typeClient = req.body.other.typeClient;
    const users = await User.findById(idUser).populate("role");
    if (users.dateSuppression != null) {
      return res.status(500).json({ message: "L'utilisateur a été supprimé." });
    }
    users.nom = nom;
    users.prenom = prenom;
    users.email = email;
    await users.save();
    if (users.role.niveau == 10) {
      const mecanicien = await Mecanicien.findOne({ user: idUser });
      mecanicien.dateEmbauche = dateEmbauche;
      await mecanicien.save();
    } else {
      const client = await Client.findOne({ user: idUser });
      client.typeClient = typeClient;
      await client.save();
    }
    if (users.role.niveau == 1) {
      const client = await Client.findOne({ user: idUser });
      client.typeClient = typeClient;
      await client.save();
    }
    return res.status(201).json({ message: "Utilisateur modifiée." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la modification de l'utilisateur." });
  }
});

// Supprimer plusieurs utilisateurs
router.post("/delete", async (req, res) => {
  try {
    const idUsers = req.body.idUsers;
    if (!idUsers || !Array.isArray(idUsers)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }

    await User.updateMany(
      { _id: { $in: idUsers } },
      { dateSuppression: new Date() }
    );
    await Mecanicien.updateMany(
      { user: { $in: idUsers } },
      { dateRenvoie: new Date() }
    );
    return res
      .status(200)
      .json({ message: "Utilisateurs supprimées avec succès." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la suppression des pièces." });
  }
});

module.exports = router;
