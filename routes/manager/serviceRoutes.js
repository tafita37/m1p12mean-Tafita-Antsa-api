const express = require("express");
const Service = require("../../models/Service");
const SousService = require("../../models/SousService");
const router = express.Router();

// Nouveau services
router.post("/insert", async (req, res) => {
  try {
    const nom=req.body.nom;
    const sousServices = req.body.sousServices;
    const service = new Service({ nom, sousServices });
    await service.save();
    return res.status(201).json({ message: "Service insérée." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'insertion de service." });
  }
});

// Liste des services
router.get("/allServices", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const allSousServices=await SousService.find();
    const total = await Service.countDocuments();
    const listServices = await Service.find()
      .populate("sousServices")
      .skip(skip)
      .limit(size);
    return res
      .status(200)
      .json({ listServices, nbServices: total, allSousServices });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Update services
router.post("/update", async (req, res) => {
  try {
    const idService=req.body.idService;
    const service = await Service.findById(idService);
    if(!service){
      return res.status(500).json({ message: "Service non trouvé." });
    }
    const nom=req.body.nom;
    const sousServices = req.body.sousServices || [];
    service.nom = nom;
    service.sousServices.push(...sousServices);
    await service.save();
    return res.status(201).json({ message: "Service modifiée." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la modification de service." });
  }
});

// Supprimer une sous service d'un service
router.post("/deleteSousFromService", async (req, res) => {
  const idService = req.body.idService;
  const idSousService = req.body.idSousService;

  try {
    const service = await Service.findById(idService);
    if (!service) {
      return res.status(404).json({ message: "Service non trouvé" });
    }

    // Filtrer la pièce à supprimer
    service.sousServices = service.sousServices.filter(
      (s) => s.toString() !== idSousService
    );

    // Sauvegarder les changements
    await service.save();
    return res
      .status(200)
      .json({ message: "Sous service supprimée avec susccès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du sous services :", error);
    return res.status(500).json({ message: "Erreur serveur", error });
  }
});

// Supprimer plusieurs services
router.post("/delete", async (req, res) => {
  try {
    const idServices = req.body.idServices;
    if (!idServices || !Array.isArray(idServices)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }
    await Service.deleteMany({ _id: { $in: idServices } });
    return res
      .status(200)
      .json({ message: "Services supprimées avec succès." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la suppression des services." });
  }
});

router.use("/sous", require("./service/sousRoutes"));

module.exports = router;
