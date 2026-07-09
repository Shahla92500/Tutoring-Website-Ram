const mongoose = require("mongoose");

// Database Connection
const dbCOnnect = () =>
	mongoose
		.connect(process.env.MONGO_URI)
		.then(() => console.log("Successfully connected to MongoDB!",mongoose.connection.name, "Host:", mongoose.connection.host))
		.catch((err) => console.error("Connection error", err));

module.exports = dbCOnnect;
