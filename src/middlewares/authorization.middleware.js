export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.authUser) {
            return next(new Error("Authentication required", { cause: 401 }));
        }

        if (!allowedRoles.includes(req.authUser.role)) {
            return next(new Error("Unauthorized", { cause: 403 }));
        }

        next();
    };
};