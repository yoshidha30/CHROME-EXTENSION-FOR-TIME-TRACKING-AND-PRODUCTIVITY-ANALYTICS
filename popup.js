console.log("popup.js loaded ✅");

// ===== Helper Functions =====

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getLast7Dates() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// ===== Today’s Summary =====

function loadTodaySummary() {
  const today = getTodayDate();
  chrome.storage.local.get([today], (res) => {
    const data = res[today] || {
      productive: 0,
      unproductive: 0,
      neutral: 0
    };

    console.log("Today's data:", data);

    document.getElementById("prod-time").textContent = data.productive || 0;
    document.getElementById("unprod-time").textContent = data.unproductive || 0;
    document.getElementById("neutral-time").textContent = data.neutral || 0;

    const total = data.productive + data.unproductive + data.neutral;
    const score = total > 0 ? Math.round((data.productive / total) * 100) : 0;
    document.getElementById("prod-score").textContent = `${score}%`;
  });
}

// ===== Weekly Chart =====

function fetchWeeklyData(callback) {
  const last7 = getLast7Dates();
  console.log("Last 7 dates:", last7);
  chrome.storage.local.get(last7, (res) => {
    console.log("Weekly data fetched from storage:", res);
    callback(res);
  });
}

function renderWeeklyChart(data) {
  const labels = Object.keys(data);
  const productive = labels.map(day => data[day]?.productive || 0);
  const unproductive = labels.map(day => data[day]?.unproductive || 0);

  console.log("Chart labels:", labels);
  console.log("Productive values:", productive);
  console.log("Unproductive values:", unproductive);

  const ctx = document.getElementById("weeklyChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Productive (min)",
          data: productive,
          backgroundColor: "green",
        },
        {
          label: "Unproductive (min)",
          data: unproductive,
          backgroundColor: "red",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ===== Top Sites =====

function renderTopSites(data) {
  const siteMap = {};
  for (const date in data) {
    const sites = data[date]?.sites || {};
    for (const site in sites) {
      siteMap[site] = (siteMap[site] || 0) + sites[site];
    }
  }

  const topSites = Object.entries(siteMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log("Top sites:", topSites);

  const ul = document.getElementById("siteList");
  ul.innerHTML = "";
  topSites.forEach(([site, min]) => {
    const li = document.createElement("li");
    li.textContent = `${site} – ${min} min`;
    ul.appendChild(li);
  });
}

// ===== Reset Button =====

document.getElementById("reset-btn").addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    alert("All data cleared!");
    location.reload();
  });
});

// ===== Initialize on Load =====

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded ✅");
  loadTodaySummary();

  fetchWeeklyData((data) => {
    renderWeeklyChart(data);
    renderTopSites(data);
  });
});

