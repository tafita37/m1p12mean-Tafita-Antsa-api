const Planning = require("../models/Planning");
const mongoose = require("mongoose");

exports.create = async (req, res) => {
    try {
        const {appointment,mechanic,date} = req.body;
        const planning = {appointment,mechanic,date};

        const newPlanning = new Planning(planning);
        await newPlanning.save();
        
          res.status(201).json({message: `Planning créé avec succès`});

    } catch (error) {
        res.status(400).json({
            message: error.message,
            details: error.errors || undefined
        });
    }
}

exports.findAll = async (req, res) => {
    try {
        const result = await Planning.find()
            .populate({
                path: 'appointment',
                populate: [
                    { path: 'vehiculeId' }, // Populate du véhicule
                    { 
                        path: 'prestations.prestationId' // Populate de la prestation
                    },
                    { 
                        path: 'prestations.pieces.pieceId' // Populate des pièces
                    }
                ]
            })
            .populate('mechanic'); // Populate du mécanicien

        res.status(200).json(result);    
    } catch (error) {
        console.error("Erreur dans findAll:", error); // Log de l'erreur pour debugging
        res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
    }
};

exports.findPlanningMechanic = async (req, res) => {
    try {
        const result = await Planning.find({
            mechanic: req.params.id
        })
        .populate({
            path: 'appointment',
            populate: [
                { path: 'vehiculeId' }, // Populate du véhicule
                { 
                    path: 'prestations.prestationId' // Populate des prestations dans appointment
                }
            ]
        });

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

