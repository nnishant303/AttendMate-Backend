const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "hr") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as HR" });
  }
};

export default adminMiddleware;
