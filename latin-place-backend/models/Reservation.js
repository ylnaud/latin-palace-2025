const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.ObjectId,
    ref: "Event",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: [true, "Por favor añade un nombre"],
  },
  email: {
    type: String,
    required: [true, "Por favor añade un email"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Por favor añade un email válido",
    ],
  },
  phone: {
    type: String,
    required: [true, "Por favor añade un teléfono"],
  },
  reservationDate: {
    type: Date,
    required: true,
  },
  numberOfPeople: {
    type: Number,
    required: true,
    min: [1, "Mínimo 1 persona"],
  },
  vipTable: {
    type: Boolean,
    default: false,
  },
  bottleService: {
    type: Boolean,
    default: false,
  },
  specialRequests: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid", "refunded"],
    default: "pending",
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate reservations per event
ReservationSchema.index({ event: 1, user: 1 }, { unique: true });

// Static method to get total reservations and amount per event
ReservationSchema.statics.getEventStats = async function (eventId) {
  const stats = await this.aggregate([
    {
      $match: { event: eventId },
    },
    {
      $group: {
        _id: "$event",
        nReservations: { $sum: 1 },
        nPeople: { $sum: "$numberOfPeople" },
        totalRevenue: { $sum: "$amountPaid" },
      },
    },
  ]);

  return stats;
};

// Update event stats after save
ReservationSchema.post("save", async function () {
  await this.constructor.getEventStats(this.event);
});

module.exports = mongoose.model("Reservation", ReservationSchema);
