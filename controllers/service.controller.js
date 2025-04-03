const Service = require("../models/Service");
const Prestation = require("../models/Prestation");


exports.create = async (req, res) => {
    try {
        // Validation des prestations
        const invalidPrestations = await validatePrestations(req.body.prestations);
        if (invalidPrestations.length > 0) {
            return res.status(400).json({ 
                message: "Certaines prestations n'existent pas",
                invalidIds: invalidPrestations
            });
        }

        const service = new Service({
            nom: req.body.nom,
            prestations: req.body.prestations
        });

        const savedService = await service.save();
        res.status(201).json({
            message: "Service créé avec succès",
            data: await Service.populate(savedService, {
                path: 'prestations',
                populate: { path: 'detailPieces' }
            })
        });
    } catch (err) {
        handleError(res, err);
    }
};


exports.findById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate({
                path: 'prestations',
                populate: [
                    { path: 'detailPieces' }
                ]
            });

        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }

        res.json(service);
    } catch (err) {
        handleError(res, err);
    }
};


exports.findAll = async (req, res) => {
    try {
        const { page = 1, size = 10, name } = req.query;
        const conditions = name ? { nom: { $regex: new RegExp(name, "i") } } : {};

        const [services, count] = await Promise.all([
            Service.find(conditions)
                .populate({
                    path: 'prestations',
                    populate: { 
                        path: 'detailPieces',
                        populate: [
                            { path: 'piece' }, 
                            { path: 'marque' }  
                        ]
                    }
                })
                .skip((page - 1) * size)
                .limit(parseInt(size)),
            
            Service.countDocuments(conditions)
        ]);

        res.json({
            count,
            data: services,
            totalPages: Math.ceil(count / size),
            currentPage: parseInt(page)
        });
    } catch (err) {
        handleError(res, err);
    }
};


exports.update = async (req, res) => {
    try {
        // Validation des prestations
        const invalidPrestations = await validatePrestations(req.body.prestations);
        if (invalidPrestations.length > 0) {
            return res.status(400).json({ 
                message: "Certaines prestations n'existent pas",
                invalidIds: invalidPrestations
            });
        }

        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            {
                nom: req.body.nom,
                prestations: req.body.prestations,
                updatedAt: Date.now()
            },
            { new: true }
        ).populate('prestations');

        if (!updatedService) {
            return res.status(404).json({ message: "Service non trouvé" });
        }

        res.json({
            message: "Service mis à jour avec succès",
            data: updatedService
        });
    } catch (err) {
        handleError(res, err);
    }
};


exports.delete = async (req, res) => {
    try {
        const deletedService = await Service.findByIdAndDelete(req.params.id);
        
        if (!deletedService) {
            return res.status(404).json({ message: "Service non trouvé" });
        }

        res.json({ message: "Service supprimé avec succès" });
    } catch (err) {
        handleError(res, err);
    }
};


async function validatePrestations(prestationIds) {
    const existingPrestations = await Prestation.find({ 
        _id: { $in: prestationIds } 
    }).select('_id');
    
    const existingIds = existingPrestations.map(p => p._id.toString());
    return prestationIds.filter(id => !existingIds.includes(id));
}


function handleError(res, err) {
    console.error(err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: "Erreur de validation",
            details: err.errors 
        });
    }
    
    res.status(500).json({ 
        message: "Erreur serveur",
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
}