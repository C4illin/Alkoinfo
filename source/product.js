const main = document.getElementById("main");
const queryString = window.location.href.split("/")[4];

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
  },
};

const url = `https://susbolaget.emrik.org/v1/product/${queryString}`;

(async () => {
  const response = await fetch(url, options);
  const json = await response.json();

  const scales = {
    x: {
      type: "time",
    },
    y: {
      type: "linear",
      display: true,
      position: "left",
      ticks: {
        callback: (value, index, ticks) => `${Math.round((value + Number.EPSILON) * 100) / 100} kr`,
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

  const dataset = [{
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
        callback: (value, index, ticks) => `${Math.round((value + Number.EPSILON) * 10) / 10} %`,
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
