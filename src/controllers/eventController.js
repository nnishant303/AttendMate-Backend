import Event from "../models/Event.js";

// @desc    Add new event
// @route   POST /api/events/add
// @access  Private (HR)
export const addEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();

    // Emit socket event
    req.io.emit("eventsUpdated", event);

    res.status(201).json({ message: "Event added successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (HR)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Emit socket event
    req.io.emit("eventsUpdated", event);

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (HR)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Emit socket event
    req.io.emit("eventsUpdated", event);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
