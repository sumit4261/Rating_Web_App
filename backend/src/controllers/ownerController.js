
const ownerModel = require("../models/ownerModel");

async function getDashboard(req, res, next) {
  try {
    const dashboard = await ownerModel.getOwnerDashboard(req.user.id);

    const totalRatings = dashboard.stores.reduce(
      (total, store) => total + Number(store.totalRatings || 0),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        stores: dashboard.stores,
        ratings: dashboard.ratings,
        summary: {
          totalStores: dashboard.stores.length,
          totalRatings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
