const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { verifyManager, verifyClient, verifyMecanicien } = require("./middlewares/auth");
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.log(err));
// Routes 
app.use("/auth", require("./routes/authentificationRoute")); 
app.use("/tokenValid", require("./routes/validToken")); 
app.use("/manager", verifyManager, require("./routes/managerRoute")); 
app.use("/landing", require("./routes/landingRoute")); 
app.use("/client", verifyClient, require("./routes/clientRoute")); 
app.use("/mecanicien", verifyMecanicien, require("./routes/mecanicienRoute")); 
app.use("/mouvement", verifyManager, require("./routes/manager/mouvementRoutes"));
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`)); 