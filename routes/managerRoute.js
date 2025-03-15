const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Mecanicien = require("../models/Mecanicien");
const Client = require("../models/Client");
const TypeClient = require("../models/TypeClient");

// Inscription mécanicien
router.get("/allUserNotValider", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 20;
    const skip = (page - 1) * size;
    const total = await User.countDocuments({ dateValidation: null });
    const existingUser = await User.find({ dateValidation: null })
      .skip(skip)
      .limit(size)
      .select("-mdp")
      .populate([
        { path: "role" },
        { path: "client" }, // Assure-toi que le champ virtuel `client` est bien défini
      ]);

    const listTypeClient = await TypeClient.find();
    res.status(201).json({ user: existingUser, typeClients: listTypeClient, nbUser : total });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

// Validation inscription utilisateur et mécanicien
router.post("/validerInscription", async (req, res) => {
  try {
    const idUser = req.body.idUser;
    const dateEmbauche = req.body.dateEmbauche;
    const typeClient = req.body.typeClient;
    const existingUser = await User.findById(idUser)
      .select("-mdp")
      .populate("role");
    if (existingUser.role.niveau == 10) {
      if (!dateEmbauche) {
        res.status(500).json({ message: "Veuillez indiquer la date d'embauche du mécanicien." });
      }
      const existingMecanicien = await Mecanicien.findOne({ user: existingUser._id });
      existingUser.dateValidation = new Date();
      existingMecanicien.dateEmbauche = dateEmbauche;
      existingUser.save();
      existingMecanicien.save();
    } else {
      if (!typeClient) {
        res
          .status(500)
          .json({
            message: "Veuillez indiquer de quel type de client il s'agit.",
          });
      }
      const existingClient = await Client.findOne({
        user: existingUser._id,
      });
      existingUser.dateValidation = new Date();
      existingClient.dateEmbauche = dateEmbauche;
      existingClient.typeClient = typeClient;
      existingUser.save();
      existingClient.save();
    }
    res.status(201).json({message : "Inscription validée."});
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});



// Refus de l'inscription utilisateur et mécanicien
router.post("/refuserInscription", async (req, res) => {
  try {
    const idUser = req.body.idUser;
    const existingUser = await User.findById(idUser);
    console.log(existingUser);
    
    const existingClient = await Client.findOne({user : existingUser._id});
    const existingMecanicien = await Mecanicien.findOne({ user: existingUser._id });
    if (existingMecanicien) await existingMecanicien.deleteOne();
    if (existingClient) await existingClient.deleteOne();
    if (existingUser) await existingUser.deleteOne();
    res.status(200).json({message : "Inscription refusée."});
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

module.exports = router;