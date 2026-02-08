export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403);
        next(new Error('Access denied. Admin only.'));
    }
};
