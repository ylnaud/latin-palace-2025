const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Por favor añade un título"],
      trim: true,
      maxlength: [100, "El título no puede exceder 100 caracteres"],
    },
    description: {
      type: String,
      required: [true, "Por favor añade una descripción"],
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "reggaeton",
        "salsa",
        "bachata",
        "techno",
        "pop",
        "live-music",
        "special",
      ],
    },
    date: {
      type: Date,
      required: [true, "Por favor añade una fecha para el evento"],
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    coverPrice: {
      type: Number,
      required: true,
    },
    featuredArtists: {
      type: [String],
      required: false,
    },
    photo: {
      type: String,
      default: "no-photo.jpg",
    },
    cloudinaryId: {
      type: String,
    },
    vipTablesAvailable: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Reverse populate with virtuals
EventSchema.virtual("reservations", {
  ref: "Reservation",
  localField: "_id",
  foreignField: "event",
  justOne: false,
});

module.exports = mongoose.model("Event", EventSchema);
