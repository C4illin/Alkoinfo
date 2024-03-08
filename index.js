// epxress and ejs
import express from "express";
import build from "./build.js";
import { CronJob } from "cron";

const app = express();
const port = 3000;

build();
// run at 06:00 every day
const job = new CronJob("0 0 6 * * *", build, null, true, "Europe/Stockholm");

// use public folder for static files
app.use(express.static("public"));

app.get("/product/:id", (req, res) => {
	const id = req.params.id;
	const url = `https://susbolaget.emrik.org/v1/product/${id}`;

	fetch(url)
		.then((response) => response.json())
		.then((json) => {
			res.render("product.ejs", { json });
		});
});

app.get("/product.html", (req, res) => {
  // old path
	const id = req.query.id;
	res.redirect(`/product/${id}`);
});

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
