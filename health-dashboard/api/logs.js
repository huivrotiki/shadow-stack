module.exports = async (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Logs API ready",
    data: []
  });
};
