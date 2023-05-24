/** @format */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const validUrl = require("valid-url");
const app = express();

// Database connection - mongoose/mongodb
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: "fcc_beda_urlshortener",
	})
	.then(() => {
		console.log("Connected to the Database.");
	})
	.catch((err) => console.error(err));

// Define URL schema
const urlSchema = new mongoose.Schema({
	originalUrl: String,
	shortUrl: String,
});

// Define URL model
const Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
// Define POST route for creating short URLs
app.post("/api/shorturl", async (req, res) => {
	const { url } = req.body;

	// Validate URL
	if (!validUrl.isWebUri(url)) {
		return res.status(400).json({ error: "invalid url" });
	}

	// Check if URL already exists in database
	const existingUrl = await Url.findOne({ originalUrl: url });
	if (existingUrl) {
		return res.json({ original_url: url, short_url: existingUrl.shortUrl });
	}

	// Generate short URL
	const count = await Url.countDocuments();
	const shortUrl = count + 1;

	// Save URL to database
	const newUrl = new Url({ originalUrl: url, shortUrl });
	await newUrl.save();

	// Return JSON response
	res.json({ original_url: url, short_url: shortUrl });
});

// Define GET route for redirecting to original URL
app.get("/api/shorturl/:shortUrl", async (req, res) => {
	const { shortUrl } = req.params;

	// Find URL in database
	const url = await Url.findOne({ shortUrl });

	// Redirect to original URL
	if (url) {
		res.redirect(url.originalUrl);
	} else {
		res.status(404).json({ error: "not found" });
	}
});

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
