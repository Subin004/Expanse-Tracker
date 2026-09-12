const jwt = require("jsonwebtoken");

function requireAuth(request, response, next) {
    const authorization = request.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return response.status(401).json({
            message: "Authentication token is required."
        });
    }

    const token = authorization.slice("Bearer ".length);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (typeof payload.sub !== "string") {
            throw new Error("Invalid token subject.");
        }

        request.userId = payload.sub;
        return next();
    } catch {
        return response.status(401).json({
            message: "Authentication token is invalid or expired."
        });
    }
}

module.exports = requireAuth;