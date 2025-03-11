// Insertion de mécanicien
// router.post("/insertMecanicien", async (req, res) => {
//   const { username, email, password } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ message: "L'utilisateur existe déjà." });

//     const newUser = new User(req.body);
//     await newUser.save();
//     console.log("secret " + SECRET_KEY);

//     const token = jwt.sign(
//       { id: newUser._id, username: newUser.email, type: "user" },
//       SECRET_KEY,
//       {
//         expiresIn: "2h",
//       }
//     );
//     res.status(201).json({ message: "Utilisateur créé avec succès.", token});
//   } catch (error) {
//     res.status(500).json({ message: "Erreur lors de l'inscription." });
//     console.error(error);
//   }
// });

// module.exports = router;