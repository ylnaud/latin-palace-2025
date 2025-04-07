const Reservation = require("../models/Reservation");
const Event = require("../models/Event");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");

// @desc    Get all reservations
// @route   GET /api/v1/reservations
// @route   GET /api/v1/events/:eventId/reservations
// @access  Private/Admin
exports.getReservations = asyncHandler(async (req, res, next) => {
  if (req.params.eventId) {
    const reservations = await Reservation.find({ event: req.params.eventId });

    return res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single reservation
// @route   GET /api/v1/reservations/:id
// @access  Private
exports.getReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate({
      path: "event",
      select: "title date startTime endTime",
    })
    .populate({
      path: "user",
      select: "name email",
    });

  if (!reservation) {
    return next(
      new ErrorResponse(`Reserva no encontrada con id ${req.params.id}`, 404)
    );
  }

  // Make sure user is reservation owner or admin
  if (
    reservation.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `Usuario ${req.user.id} no está autorizado para ver esta reserva`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: reservation,
  });
});

// @desc    Add reservation
// @route   POST /api/v1/events/:eventId/reservations
// @access  Private
exports.addReservation = asyncHandler(async (req, res, next) => {
  req.body.event = req.params.eventId;
  req.body.user = req.user.id;

  const event = await Event.findById(req.params.eventId);

  if (!event) {
    return next(
      new ErrorResponse(`No existe evento con id ${req.params.eventId}`, 404)
    );
  }

  // Check if event is active
  if (!event.isActive) {
    return next(
      new ErrorResponse(`El evento ${event.title} no está activo`, 400)
    );
  }

  // Check if event date is in the past
  if (event.date < Date.now()) {
    return next(
      new ErrorResponse(`El evento ${event.title} ya ha ocurrido`, 400)
    );
  }

  // Check if user already has a reservation for this event
  const existingReservation = await Reservation.findOne({
    event: req.params.eventId,
    user: req.user.id,
  });

  if (existingReservation) {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} ya tiene una reserva para este evento`,
        400
      )
    );
  }

  // Calculate total amount
  let totalAmount = 0;

  // Add cover price per person
  totalAmount += event.coverPrice * req.body.numberOfPeople;

  // Add VIP table cost if selected
  if (req.body.vipTable) {
    totalAmount += 100; // Assuming VIP table costs 100€ extra
  }

  // Add bottle service cost if selected
  if (req.body.bottleService) {
    totalAmount += 150; // Assuming bottle service costs 150€
  }

  req.body.totalAmount = totalAmount;

  const reservation = await Reservation.create(req.body);

  // Send confirmation email
  try {
    await sendEmail({
      email: req.user.email,
      subject: `Confirmación de reserva para ${event.title}`,
      message: `Hola ${req.user.name},\n\nTu reserva para ${
        event.title
      } el ${event.date.toLocaleDateString()} ha sido confirmada.\n\nDetalles:\n- Número de personas: ${
        reservation.numberOfPeople
      }\n- Mesa VIP: ${
        reservation.vipTable ? "Sí" : "No"
      }\n- Servicio de botella: ${
        reservation.bottleService ? "Sí" : "No"
      }\n- Total: €${
        reservation.totalAmount
      }\n\nGracias por reservar con Latin Place!`,
    });
  } catch (err) {
    console.log(err);
  }

  res.status(201).json({
    success: true,
    data: reservation,
  });
});

// @desc    Update reservation
// @route   PUT /api/v1/reservations/:id
// @access  Private
exports.updateReservation = asyncHandler(async (req, res, next) => {
  let reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return next(
      new ErrorResponse(`Reserva no encontrada con id ${req.params.id}`, 404)
    );
  }

  // Make sure user is reservation owner or admin
  if (
    reservation.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `Usuario ${req.user.id} no está autorizado para actualizar esta reserva`,
        401
      )
    );
  }

  // Recalculate total amount if necessary
  if (req.body.numberOfPeople || req.body.vipTable || req.body.bottleService) {
    const event = await Event.findById(reservation.event);

    let totalAmount = 0;
    const numberOfPeople =
      req.body.numberOfPeople || reservation.numberOfPeople;
    const vipTable =
      req.body.vipTable !== undefined
        ? req.body.vipTable
        : reservation.vipTable;
    const bottleService =
      req.body.bottleService !== undefined
        ? req.body.bottleService
        : reservation.bottleService;

    totalAmount += event.coverPrice * numberOfPeople;

    if (vipTable) {
      totalAmount += 100;
    }

    if (bottleService) {
      totalAmount += 150;
    }

    req.body.totalAmount = totalAmount;
  }

  reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: reservation,
  });
});

// @desc    Delete reservation
// @route   DELETE /api/v1/reservations/:id
// @access  Private
exports.deleteReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return next(
      new ErrorResponse(`Reserva no encontrada con id ${req.params.id}`, 404)
    );
  }

  // Make sure user is reservation owner or admin
  if (
    reservation.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `Usuario ${req.user.id} no está autorizado para eliminar esta reserva`,
        401
      )
    );
  }

  await reservation.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Process payment for reservation
// @route   PUT /api/v1/reservations/:id/pay
// @access  Private
exports.processPayment = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return next(
      new ErrorResponse(`Reserva no encontrada con id ${req.params.id}`, 404)
    );
  }

  // Make sure user is reservation owner or admin
  if (
    reservation.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `Usuario ${req.user.id} no está autorizado para pagar esta reserva`,
        401
      )
    );
  }

  // In a real app, you would integrate with a payment gateway here
  // For demo purposes, we'll just mark as paid

  const paymentAmount = req.body.amount || reservation.totalAmount;

  if (paymentAmount < reservation.totalAmount) {
    reservation.paymentStatus = "partial";
  } else {
    reservation.paymentStatus = "paid";
  }

  reservation.amountPaid = paymentAmount;

  await reservation.save();

  res.status(200).json({
    success: true,
    data: reservation,
  });
});
