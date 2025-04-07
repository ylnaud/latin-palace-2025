const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/sendEmail");

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Make sure token exists
  if (!token) {
    return next(
      new ErrorResponse("No autorizado para acceder a esta ruta", 401)
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(
      new ErrorResponse("No autorizado para acceder a esta ruta", 401)
    );
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `El rol ${req.user.role} no está autorizado para acceder a esta ruta`,
          403
        )
      );
    }
    next();
  };
};
