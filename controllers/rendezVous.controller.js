const RendezVous = require('../models/RendezVous');
const mongoose = require('mongoose');
const sendEmail = require("../mail/mailer");

exports.create = async (req, res) => {
    try {
        const { type, vehiculeId, dateRdv, prestations, demandeDevis, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(vehiculeId) ){
            return res.status(400).json({ message: "ID de véhicule invalide" });
        }

        const rdvData = {
            type,
            vehiculeId,
            dateRdv: new Date(dateRdv),
            notes
        };


        if (type === 'standard') {
            rdvData.prestations = prestations.map(p => ({
                prestationId: p.prestationId,
                pieces: p.pieces.map(piece => ({ pieceId: piece.pieceId }))
            }));
        } else if (type === 'devis') {
            rdvData.demandeDevis = {
                description: demandeDevis.description,
                photos: demandeDevis.photos || []
            };
        }

        const nouveauRdv = new RendezVous(rdvData);
        await nouveauRdv.save();

        res.status(201).json({
            message: `Rendez-vous ${type} créé avec succès`,
            data: await RendezVous.findById(nouveauRdv._id)
                .populate('vehiculeId prestations.prestationId prestations.pieces.pieceId')
        });

    } catch (error) {
        res.status(400).json({
            message: error.message,
            details: error.errors || undefined
        });
    }
};

exports.findAll = async (req, res) => {
    try {
        const { type, status } = req.query;
        const filter = {}; 
        
        if (type) filter.type = type;
        if (status) filter.status = status;

        const rdvs = await RendezVous.find(filter)
            .populate('vehiculeId')
            .sort({ dateRdv: 1 });

        res.json({
            count: rdvs.length,
            data: rdvs
        });
    } catch (error) {
        console.error("Erreur dans findAll:", error); // Log de l'erreur pour debugging
        res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
    }
};


exports.findById = async (req, res) => {
    try {
        const rdv = await RendezVous.findById(req.params.id)
            .populate('vehiculeId prestations.prestationId prestations.pieces.pieceId');

        if (!rdv) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        res.json(rdv);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération" });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };

        // Gestion des dates associées aux statuts
        if (status === 'accepté') updateData.DateConfirmation = new Date();
        if (status === 'terminé') updateData.completedAt = new Date();

        const rdv = await RendezVous.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('vehiculeId');

        if (!rdv) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        res.json({
            message: `Statut mis à jour: ${status}`,
            data: rdv
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
            details: error.errors || undefined
        });
    }
};

exports.rejectAppointment = async (req, res) => {
    try {
        const { motif,status } = req.body;
        const updateData = { motif,status };

        const rdv = await RendezVous.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'vehiculeId',
            populate: {
                path: 'proprietaire'
            }
        });

        const formattedDate = new Date(rdv.dateRdv).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });
        
        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
        const finalDate = formattedDate.split(' ').map(capitalize).join(' ');
        
        sendEmail(rdv.vehiculeId.proprietaire.email,"Demande de rendez-vous rejetée","reject", {
            clientName: rdv.vehiculeId.proprietaire.prenom,
            appointmentDate: finalDate,
            reason: rdv.motif,
        });

        if (!rdv) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        res.json({
            message: `Statut mis à jour: ${status}`,
            data: rdv
        });

    } catch (error) {
        res.status(400).json({
            message: error.message,
            details: error.errors || undefined
        });
    }
}

exports.acceptAppointment = async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };

        const rdv = await RendezVous.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'vehiculeId',
            populate: {
                path: 'proprietaire'
            }
        });

        const formattedDate = new Date(rdv.dateRdv).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });
        
        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
        const finalDate = formattedDate.split(' ').map(capitalize).join(' ');
        
        sendEmail(rdv.vehiculeId.proprietaire.email,"Demande de rendez-vous acceptée","confirm", {
            clientName: rdv.vehiculeId.proprietaire.prenom,
            appointmentDate: finalDate,
        });

        if (!rdv) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        res.json({
            message: `Statut mis à jour: ${status}`,
            data: rdv
        });

    } catch (error) {
        res.status(400).json({
            message: error.message,
            details: error.errors || undefined
        });
    }
}

exports.delete = async (req, res) => {
    try {
        const rdv = await RendezVous.findByIdAndDelete(req.params.id);
        
        if (!rdv) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        res.json({ message: "Rendez-vous supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};


exports.findPendingAppointments = async (req, res) => {
    try {
        const { type, status } = req.query;
        const filter = { status: "en attente" };

        if (type) filter.type = type;
        if (status) filter.status = status;

        const rdvs = await RendezVous.find(filter)
            .populate({
                path: 'vehiculeId',
                populate: { path: 'proprietaire' } // Populate du propriétaire dans le véhicule
            })
            .populate('prestations.prestationId') // Populate du prestationId
            .sort({ dateRdv: 1 });

        res.json({
            count: rdvs.length,
            data: rdvs
        });
    } catch (error) {
        console.error("Erreur dans findPendingAppointments:", error);
        res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
    }
};
