const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

// Middleware de vérification du token
const verifyToken = function (req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Accès refusé" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token invalide" });
  }
};
