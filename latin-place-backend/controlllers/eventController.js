const Event = require("../models/Event");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const cloudinary = require("../config/cloudinary");

// @desc    Get all events
// @route   GET /api/v1/events
// @access  Public
exports.getEvents = asyncHandler(async (req, res, next) => {
  // Filter by date (future events)
  let query = { date: { $gte: Date.now() }, isActive: true };

  // Filter by event type
  if (req.query.eventType) {
    query.eventType = req.query.eventType;
  }

  // Search by title
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: "i" };
  }

  const events = await Event.find(query).sort("date");

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Get single event
// @route   GET /api/v1/events/:id
// @access  Public
exports.getEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id).populate({
    path: "reservations",
    select: "name email phone reservationDate numberOfPeople status",
  });

  if (!event) {
    return next(
      new ErrorResponse(`Evento no encontrado con id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Create new event
// @route   POST /api/v1/events
// @access  Private/Admin
exports.createEvent = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Upload image to Cloudinary if file is uploaded
  if (req.files) {
    const file = req.files.photo;

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Por favor sube una imagen menor a ${
            process.env.MAX_FILE_UPLOAD / 1000
          }MB`,
          400
        )
      );
    }

    // Upload file
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "latin-place/events",
      use_filename: true,
      unique_filename: false,
    });

    req.body.photo = result.secure_url;
    req.body.cloudinaryId = result.public_id;
  }

  const event = await Event.create(req.body);

  res.status(201).json({
    success: true,
    data: event,
  });
});

// @desc    Update event
// @route   PUT /api/v1/events/:id
// @access  Private/Admin
exports.updateEvent = asyncHandler(async (req, res, next) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new ErrorResponse(`Evento no encontrado con id ${req.params.id}`, 404)
    );
  }

  // Upload new image if file is uploaded
  if (req.files) {
    const file = req.files.photo;

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Por favor sube una imagen menor a ${
            process.env.MAX_FILE_UPLOAD / 1000
          }MB`,
          400
        )
      );
    }

    // Delete old image from Cloudinary if exists
    if (event.cloudinaryId) {
      await cloudinary.uploader.destroy(event.cloudinaryId);
    }

    // Upload new file
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "latin-place/events",
      use_filename: true,
      unique_filename: false,
    });

    req.body.photo = result.secure_url;
    req.body.cloudinaryId = result.public_id;
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Delete event
// @route   DELETE /api/v1/events/:id
// @access  Private/Admin
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new ErrorResponse(`Evento no encontrado con id ${req.params.id}`, 404)
    );
  }

  // Delete image from Cloudinary if exists
  if (event.cloudinaryId) {
    await cloudinary.uploader.destroy(event.cloudinaryId);
  }

  await event.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get events within a radius
// @route   GET /api/v1/events/radius/:zipcode/:distance
// @access  Public
exports.getEventsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide distance by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const events = await Event.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Upload photo for event
// @route   PUT /api/v1/events/:id/photo
// @access  Private/Admin
exports.eventPhotoUpload = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new ErrorResponse(`Evento no encontrado con id ${req.params.id}`, 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Por favor sube un archivo`, 400));
  }

  const file = req.files.file;

  // Check if the file is an image
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Por favor sube un archivo de imagen`, 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Por favor sube una imagen menor a ${
          process.env.MAX_FILE_UPLOAD / 1000
        }MB`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${event._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problema subiendo el archivo`, 500));
    }

    await Event.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
