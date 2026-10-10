
const storeModel = require("../models/storeModel");

async function getStores(req, res) {
  try {
    const userId = req.user.id;
    const name = String(req.query.name || "").trim();
    const address = String(req.query.address || "").trim();

    if (name.length > 255 || address.length > 400) {
      return res.status(400).json({
        success: false,
        message: "Search filters are too long",
      });
    }

    const stores = await storeModel.getStoresForUser(userId, {
      name,
      address,
    });

    return res.status(200).json({
      success: true,
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("Get stores error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve stores",
    });
  }
}

module.exports = { getStores };
