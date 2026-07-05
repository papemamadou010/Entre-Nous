module.exports = (req, res, next) => {
    // Vérifier si l'utilisateur est connecté et s'il est bien admin
    if (req.session && req.session.userRole === 'admin') {
        return next(); // Tout est OK, on le laisse passer
    }
    
    // Si ce n'est pas un admin, on lui refuse l'accès
    return res.status(403).send("Accès refusé : Cet espace est réservé aux administrateurs.");
};
