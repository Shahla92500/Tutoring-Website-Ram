const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const dbConnect = require("./config/dbConnect");


dotenv.config();

//Database Connection
dbConnect();

const app = express();
const PORT = process.env.PORT || 4000;
const configuredFrontendUrls = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

// ===== Middleware =====
app.use(morgan("dev"));

// Updated CORS configuration
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isLocalDev = /^http:\/\/localhost:\d+$/.test(origin);
    if (isLocalDev || configuredFrontendUrls.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passport config
require("./config/passport");

// ===== Routes =====
app.use("/users", require("./routes/userRouter"));
app.use("/requests", require("./routes/requestRouter"));
app.use("/availability", require("./routes/availabilityRouter"));
app.use("/settings", require("./routes/settingsRouter"));


app.get("/", (req, res) => {
	res.send("Ramtin Website BE + API is running!");
});

// Error handling middlewareurlencode
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: err.message 
  });
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
