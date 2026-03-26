module.exports = async (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Metrics API ready",
    data: {}
  });
};
