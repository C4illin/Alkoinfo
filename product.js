const main = document.getElementById("main");
const queryString = window.location.search.split("=")[1];
main.innerHTML = queryString;

let options = {
  method: "GET",
  headers: {
    accept: "application/json",
    // "access-control-allow-origin": "*",
    // "ocp-apim-subscription-key": "cfc702aed3094c86b92d6d4ff7a54c84",
    // "Referer": "https://www.systembolaget.se/",
    // "mode": "cors",
  },
};

let url = "https://susbolaget.emrik.org/v1/product/" + queryString;

(async () => {
  const response = await fetch(url, options);
  const json = await response.json();

  document.title =
    "Alkoinfo | " + json.productNameBold + " " + (json.productNameThin || "");

  let tasteTotal = ""
  for (let clock of json.tasteClocks) {
    tasteTotal += `<tr><td>${clock.key.replace("TasteClock", "")}</td><td>${clock.value}/12</td></tr>`
  }

  let taste = ""
  if (json.tasteClocks.length > 0 || json.usage || json.taste || json.color || json.sugarContentGramPer100ml) {
    taste = `<h3>Smak</h3>
    <table>
      <tr>
        <td>Servering</td>
        <td>${json.usage ? json.usage : "Ej testad"}</td>
      </tr>
      <tr>
        <td>Smak</td>
        <td>${json.taste ? json.taste : "Ej testad"}</td>
      </tr>
      <tr>
        <td>Färg</td>
        <td>${json.color ? json.color : "Ej testad"}</td>
      </tr>
      <tr>
        <td>Sockerinnehåll</td>
        <td>${json.sugarContentGramPer100ml ? json.sugarContentGramPer100ml + "g/100ml" : "Ej testad"} </td>
      </tr>

      ${tasteTotal}
    </table>`
  }

  main.innerHTML = `
    <div>
      <header><a href="https://alkoinfo.emrik.org/">Alkoinfo</a></header>
      <hr>
      <h1><a href="https://www.systembolaget.se/${json.productNumber}"><b>${json.productNameBold}</b>${json.productNameThin != null ? " " + json.productNameThin : ""}</a></h1>
      <h3>Grundläggande info</h3>
      <table>
        <tr>
          <td>Id</td>
          <td>${json.productId}</td>
        </tr>
        <tr>
          <td>Artikelnummer</td>
          <td>${json.productNumber}</td>
        </tr>
        <tr>
          <td>Pris</td>
          <td>${json.price} kr</td>
        </tr>
        <tr>
          <td>Alkoholhalt</td>
          <td>${json.alcoholPercentage} %</td>
        </tr>
        <tr>
          <td>Volym</td>
          <td>${json.volumeText}</td>
        </tr>
        <tr>
          <td>Tillverkare</td>
          <td>${json.producerName}</td>
        </tr>
        <tr>
          <td>Leverantör</td>
          <td>${json.supplierName}</td>
        </tr>
        <tr>
          <td>Land</td>
          <td>${json.country + (json.originLevel1 != null ? ", " + json.originLevel1 : "") + (json.originLevel2 != null ? ", " + json.originLevel2 : "")}</td>
        </tr>
        <tr>
          <td>Sortiment</td>
          <td>${json.assortmentText}</td>
        </tr>
        <tr>
          <td>Kategori</td>
          <td>${json.customCategoryTitle}</td>
        </tr>
        <tr>
          <td>Släpptes</td>
          <td>${json.productLaunchDate.split("T")[0]}</td>
        </tr>
        <tr>
          <td>Uppdaterad</td>
          <td>${(json.changedDate != "1673910000000") ? new Date(json.changedDate + 3600000).toISOString().split("T")[0] : "Nej"}</td>
        </tr>
        <tr>
          <td>Nyhet</td>
          <td>${json.isNews ? "Ja" : "Nej"}</td>
        </tr>
      </table>

      ${taste}
      
      <h3>Flaska</h3>
      <table>
        <tr>
          <td>Typ</td>
          <td>${json.packagingLevel1}</td>
        </tr>
        <tr>
          <td>Pant</td>
          <td>${json.recycleFee || 0} kr</td>
        </tr>
      </table>
    </div>
    <h3>Historik</h3>
    <div>
      <canvas id="myChart"></canvas>
    </div>
    <h4>Rådata</h4>
    `;
  // );


  let scales = {
    x: {
      type: "time",
    },
    y: {
      type: "linear",
      display: true,
      position: "left",
      ticks: {
        callback: function (value, index, ticks) {
          return Math.round((value + Number.EPSILON) * 100) / 100 + " kr";
        },
      },
    },
    y2: {
      type: "linear",
      display: false,
      grid: {
        drawOnChartArea: false,
      },
    },
  }

  let dataset = [{
    data: json.priceHistory,
    label: "Pris [kr]",
    yAxisID: "y",
  }]

  if (json.alcoholHistory.length > 1) {
    dataset.push({
      data: json.alcoholHistory,
      label: "Alkoholhalt [%]",
      yAxisID: "y1",
    })

    scales.y1 = {
      type: "linear",
      display: true,
      position: "right",
      ticks: {
        callback: function (value, index, ticks) {
          return Math.round((value + Number.EPSILON) * 10) / 10 + " %";
        },
      },
      grid: {
        drawOnChartArea: false,
      },
    };
  }

  if (json.soldVolume) {
    dataset.push({
      data: json.soldVolume,
      label: "Såld volym [l/år]",
      yAxisID: "y2",
    })
  }

  const ctx = document.getElementById("myChart");
  new Chart(ctx, {
    type: "line",
    data: {
      datasets: dataset
    },
    options: {
      scales: scales,
    },
  });

  main.appendChild(renderjson(json));
})();
