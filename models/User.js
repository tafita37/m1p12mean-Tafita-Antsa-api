const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est requis."],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est requis."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide."],
    },
    mdp: {
      type: String,
      required: [true, "Le mot de passe est requis."],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Le rôle est requis."],
    },
    dateValidation: {
      type: Date,
      default: null, // Champ nullable par défaut
    },
    dateSuppression: {
      type: Date,
      default: null, // Champ nullable par défaut
    },
  },
  { timestamps: true }
);

// Définir un champ virtuel pour les clients
UserSchema.virtual("client", {
  ref: "Client",
  localField: "_id",
  foreignField: "user",
  justOne: true // Mettre à false si un utilisateur peut avoir plusieurs clients
});

// Définir un champ virtuel pour les mécaniciens
UserSchema.virtual("mecanicien", {
  ref: "Mecanicien",
  localField: "_id",
  foreignField: "user",
  justOne: true // Mettre à false si un utilisateur peut avoir plusieurs clients
});

// Activer les champs virtuels dans les résultats JSON
UserSchema.set("toObject", { virtuals: true });
UserSchema.set("toJSON", { virtuals: true });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("mdp")) return next();
  this.mdp = await bcrypt.hash(this.mdp, 10);
  next();
});
module.exports = mongoose.model("User", UserSchema);
