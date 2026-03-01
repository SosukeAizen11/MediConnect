export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            return next(
                new Error(`User role ${req.user.role} is not authorized to access this route`)
            );
        }
        return next();
    };
};
