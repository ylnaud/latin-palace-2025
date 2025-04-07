const express = require("express");
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsInRadius,
  eventPhotoUpload,
} = require("../controllers/eventController");

const Reservation = require("../models/Reservation");
const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Re-route into other resource routers
router.use("/:eventId/reservations", require("./reservationRoutes"));

router.route("/radius/:zipcode/:distance").get(getEventsInRadius);

router
  .route("/")
  .get(getEvents)
  .post(protect, authorize("admin", "publisher"), createEvent);

router
  .route("/:id")
  .get(getEvent)
  .put(protect, authorize("admin", "publisher"), updateEvent)
  .delete(protect, authorize("admin", "publisher"), deleteEvent);

router
  .route("/:id/photo")
  .put(protect, authorize("admin", "publisher"), eventPhotoUpload);

module.exports = router;
