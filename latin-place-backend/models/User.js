const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Por favor añade un nombre"],
    trim: true,
    maxlength: [50, "El nombre no puede exceder 50 caracteres"],
  },
  email: {
    type: String,
    required: [true, "Por favor añade un email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Por favor añade un email válido"],
  },
  password: {
    type: String,
    required: [true, "Por favor añade una contraseña"],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "publisher", "admin"],
    default: "user",
  },
  phone: {
    type: String,
    required: [true, "Por favor añade un teléfono"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  newsletterSubscription: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
