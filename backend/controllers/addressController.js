const Address = require("../models/addressModel");

// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find();
    res.json(addresses);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching addresses", error: error.message });
  }
};

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const { streetAddress, city, state, postalCode, country, isDefault } =
      req.body;

    // Check if an identical address already exists
    const existingAddress = await Address.findOne({
      streetAddress: { $regex: new RegExp("^" + streetAddress + "$", "i") },
      city: { $regex: new RegExp("^" + city + "$", "i") },
      state: { $regex: new RegExp("^" + state + "$", "i") },
      postalCode,
      country: { $regex: new RegExp("^" + country + "$", "i") },
    });

    if (existingAddress) {
      return res.status(200).json({
        message: "Address already exists",
        address: existingAddress,
      });
    }

    // If this is the first address, make it default
    const addressCount = await Address.countDocuments();
    const shouldBeDefault = isDefault || addressCount === 0;

    const address = new Address({
      streetAddress,
      city,
      state,
      postalCode,
      country,
      isDefault: shouldBeDefault,
    });

    await address.save();
    res.status(201).json(address);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating address", error: error.message });
  }
};

// Update an address
exports.updateAddress = async (req, res) => {
  try {
    const { streetAddress, city, state, postalCode, country, isDefault } =
      req.body;

    const address = await Address.findById(req.params.id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    address.streetAddress = streetAddress;
    address.city = city;
    address.state = state;
    address.postalCode = postalCode;
    address.country = country;
    address.isDefault = isDefault;

    await address.save();
    res.json(address);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating address", error: error.message });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await Address.findByIdAndDelete(req.params.id);

    // If the deleted address was default, make the oldest remaining address default
    if (address.isDefault) {
      const oldestAddress = await Address.findOne().sort({ createdAt: 1 });
      if (oldestAddress) {
        oldestAddress.isDefault = true;
        await oldestAddress.save();
      }
    }

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting address", error: error.message });
  }
};
