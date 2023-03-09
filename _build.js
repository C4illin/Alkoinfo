const https = require("https");
const fs = require("fs");
const ejs = require("ejs");
const core = require("@actions/core"); // required to be able to fail correctly

const getUrl = async (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          let result = JSON.parse(body);
          resolve(result);
        } catch (error) {
          core.setFailed(error.message);
          reject(error.message);
        }
      });
    });
  });
};

(async () => {

  let products = await getUrl("https://susbolaget.emrik.org/v1/products");
  let updatedProducts = await getUrl("https://susbolaget.emrik.org/v1/products/updated");

  // create folder _site
  try {
    fs.mkdirSync("_site");
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }

  //generate sitemap.xml from products
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://alkoinfo.emrik.org/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>${products.map((product) => `<url>
    <loc>https://alkoinfo.emrik.org/product.html?id=${product.productNumber}</loc>
    <lastmod>${new Date(product.changedDate).toISOString()}</lastmod>
  </url>`).join("")}
</urlset>`;
  fs.writeFileSync("_site/sitemap.xml", sitemap);

  // <changefreq>daily</changefreq>
  // <priority>0.8</priority>

  const updated = products
    .filter((product) => updatedProducts.map((p) => p.id).includes(product.productNumber))
    .map((product) => {
      const reason = updatedProducts.find((p) => p.id === product.productNumber)?.reason;
      if (reason) {
        return { ...product, reason };
      } else {
        return product;
      }
    });

  // sort by changedDate
  updated.sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate));

  ejs.renderFile("index.ejs", { "updated": updated }, (err, str) => {
    if (err) {
      core.setFailed(err.message);
    } else {
      fs.writeFileSync("_site/index.html", str);
    }
  });

  // copy all files except files in don't copy
  const dontCopy = [
    "node_modules",
    "package.json",
    "package-lock.json",
    "README.md",
  ];

  const files = fs.readdirSync(".");
  for (const file of files) {
    if (dontCopy.includes(file) || file.startsWith("_") || file.startsWith(".") || file.endsWith(".ejs")) continue;
    fs.copyFileSync(file, `_site/${file}`);
  }
})();
