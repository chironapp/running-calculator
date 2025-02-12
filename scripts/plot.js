// plot.js

let speedDurationChartInstance = null;
let paceDurationChartInstance = null;

function speedToPace(speed) {
  const paceInSeconds = 1000 / speed; // seconds per kilometer
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = Math.round(paceInSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function formatSecondsToMinutes(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

function formatMinutes(minutes) {
  const wholeMinutes = Math.floor(minutes);
  const fractionalMinutes = minutes - wholeMinutes;
  const seconds = Math.round(fractionalMinutes * 60);
  return `${wholeMinutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function plotSpeedDurationChart(cs, yIntercept) {
  const durations = [];
  const speeds = [];

  for (let i = 0; i <= 80; i++) {
    const durationInSeconds = i * 15; // Convert minutes to seconds
    const speed = cs + yIntercept / durationInSeconds;
    durations.push(durationInSeconds / 60);
    speeds.push(speed);
  }

  const ctx = document.getElementById("speedDurationChart").getContext("2d");

  // Destroy the existing chart instance if it exists
  if (speedDurationChartInstance !== null) {
    speedDurationChartInstance.destroy();
  }

  speedDurationChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: durations,
      datasets: [
        {
          label: "Speed vs Duration",
          data: speeds,
          borderColor: "#ffcc00",
          borderWidth: 2,
          fill: false,
        },
        {
          label: `Critical Speed ${cs.toFixed(2)}m/s`,
          data: Array(durations.length).fill(cs),
          borderColor: "#cc0000",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Duration (minutes)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Speed (m/s)",
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const xValue = context.parsed.x;
              const yValue = context.raw;
              // return `${label}: ${formatSecondsToMinutes(value)}`;
              return `duration: ${formatMinutes(
                xValue / 4
              )}, speed: ${yValue.toFixed(1)}m/s, distance: ${(
                ((xValue / 4) * 60 * yValue) /
                1000
              ).toFixed(2)} km`;
            },
          },
          filter: function (context) {
            // Check the label of the dataset. If it is 'Critical Speed', do not show the tooltip for this dataset.
            return !context.dataset.label.includes("Critical Speed");
          },
        },
      },
    },
  });
}

function plotPaceDurationChart(cs, yIntercept) {
  const durations = [];
  const paces = [];

  for (let i = 0; i <= 80; i++) {
    const durationInSeconds = i * 15; // Convert minutes to seconds
    const speed = cs + yIntercept / durationInSeconds;
    //   const pace = 1000 / (speed * 60); // Convert speed (m/s) to pace (min/km)
    const pace = 1000 / speed; // Convert speed (m/s) to pace (s/km)
    durations.push(durationInSeconds / 60);
    paces.push(pace);
  }

  const ctx = document.getElementById("paceDurationChart").getContext("2d");

  // Destroy the existing chart instance if it exists
  if (paceDurationChartInstance !== null) {
    paceDurationChartInstance.destroy();
  }

  paceDurationChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: durations,
      datasets: [
        {
          label: "Speed vs Duration",
          data: paces,
          borderColor: "#ffcc00",
          borderWidth: 2,
          fill: false,
        },
        {
          label: `Critical Speed ${formatSecondsToMinutes(1000 / cs)}/km`,
          // data: Array(durations.length).fill(1000 / (cs * 60)),
          data: Array(durations.length).fill(1000 / cs),
          borderColor: "#cc0000",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Duration (minutes)",
          },
          ticks: {
            stepSize: 2, // Set the interval between ticks to 1 minute
          },
        },
        y: {
          title: {
            display: true,
            text: "Pace (min/km)",
          },
          ticks: {
            callback: function (value) {
              return formatSecondsToMinutes(value); // Display the pace as "mm:ss"
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const xValue = context.parsed.x;
              const yValue = context.raw;
              // return `${label}: ${formatSecondsToMinutes(value)}`;
              return `duration: ${formatMinutes(
                xValue / 4
              )}, pace: ${formatSecondsToMinutes(yValue)}/km, distance: ${(
                (xValue / 4 / yValue) *
                60
              ).toFixed(2)} km`;
            },
          },
          filter: function (context) {
            // Check the label of the dataset. If it is 'Critical Speed', do not show the tooltip for this dataset.
            return !context.dataset.label.includes("Critical Speed");
          },
        },
      },
    },
  });
}
