const express = require("express");
const {
  getReservations,
  getReservation,
  addReservation,
  updateReservation,
  deleteReservation,
  processPayment,
} = require("../controllers/reservationController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin"), getReservations)
  .post(protect, addReservation);

router
  .route("/:id")
  .get(protect, getReservation)
  .put(protect, updateReservation)
  .delete(protect, deleteReservation);

router.route("/:id/pay").put(protect, processPayment);

module.exports = router;
