function calculateTrack() {
  //////////////////////////
  // track calculator
  // set distance and time from from input
  var trackDistance = document.getElementById("trackDistance").value;
  var trackTime =
    document.getElementById("trackTimeMM").value * 60 +
    document.getElementById("trackTimeSS").value * 1;
  var trackLane = document.getElementById("laneSelect").value * 1;

  // training zones
  let trackSplits = {};
  let trackRows = [
    "-3",
    "-2.5",
    "-2",
    "-1.5",
    "-1",
    "-0.5",
    "0",
    "0.5",
    "1",
    "1.5",
    "2",
    "2.5",
    "3",
  ];
  trackRows.forEach(function (item, index) {
    trackSplits[item] = new TrackSplit(
      trackDistance,
      trackTime,
      item * 1.0,
      trackLane * 1.0
    );
  });

  // output
  // update track splits table elements
  trackRows.forEach(function (item, index) {
    updateElementById("track_" + item + "_400", trackSplits[item].split400);
    updateElementById(
      "track_" + item + "_lane",
      trackSplits[item].splitLaneSelect
    );
    updateElementById("track_" + item + "_1000", trackSplits[item].split1000);
    updateElementById("track_" + item + "_mile", trackSplits[item].splitMile);
    updateElementById(
      "track_" + item + "_speed",
      trackSplits[item].speed.toFixed(1)
    );
  });
}

function calculate() {
  // I feel like there is a much smarter way to refactor the code in these 3 classes
  // but life is short and I am busy.

  class RacePrediction {
    // uses Riegel's formula to predict time for a race distance
    constructor(resultDistanceInKm, resultTimeInSeconds, raceDistanceInKm) {
      this.resultDistance = resultDistanceInKm;
      this.resultTimeInSeconds = resultTimeInSeconds;
      this.distance = raceDistanceInKm;

      // Predict time for the race distance using Riegel's formula
      this.timeInSeconds = predictT2Riegel(
        this.resultDistance,
        this.distance,
        this.resultTimeInSeconds
      ); // (s)
      this.paceInSeconds = this.timeInSeconds / this.distance; // (s/km)
      this.pace400InSeconds = this.paceInSeconds * 0.4; // (s/400m)
      this.paceMileInSeconds = this.paceInSeconds * 1.609; // (s/mile)
      this.speed = (this.distance * 1000) / this.timeInSeconds; // (m/s)
      this.time = convertNumToTime(this.timeInSeconds); // 'hh:mm:ss'
      this.pace = convertNumToTime(this.paceInSeconds); // 'mm:ss'/km
      this.pace400 = convertNumToTime(this.pace400InSeconds); // 'mm:ss'/400m
      this.paceMile = convertNumToTime(this.paceMileInSeconds); // 'mm:ss'/mile
    }
  }

  class RacePredictionUsingCriticalSpeed {
    // uses Critical Speed to predict time for a race distance
    constructor(criticalSpeed, raceDistanceInKm) {
      this.criticalSpeed = criticalSpeed.cs;
      this.Dprime = criticalSpeed.Dprime;
      this.distance = raceDistanceInKm;

      // speed = CS + D' / time
      // time = (distance - D') / CS
      this.timeInSeconds =
        (this.distance * 1000 - this.Dprime) / this.criticalSpeed; // (s)
      // the speed duration curve is only valid for short-medium durations (eg < 30-40min)
      // so if the predicted time is longer than 40min, use Riegel's formula instead
      if (this.timeInSeconds > 30 * 60) {
        // use critical speed to estimate distance over 20min then use Riegel's formula to predict time using these values
        const distance20minInKm =
          (this.criticalSpeed * 20 * 60 + this.Dprime) / 1000; // (km)
        this.timeInSeconds = predictT2Riegel(
          distance20minInKm,
          this.distance,
          20 * 60
        ); // (s)
      }
      this.paceInSeconds = this.timeInSeconds / this.distance; // (s/km)
      this.pace400InSeconds = this.paceInSeconds * 0.4; // (s/400m)
      this.paceMileInSeconds = this.paceInSeconds * 1.609; // (s/mile)
      this.speed = (this.distance * 1000) / this.timeInSeconds; // (m/s)
      this.time = convertNumToTime(this.timeInSeconds); // 'hh:mm:ss'
      this.pace = convertNumToTime(this.paceInSeconds); // 'mm:ss'/km
      this.pace400 = convertNumToTime(this.pace400InSeconds); // 'mm:ss'/400m
      this.paceMile = convertNumToTime(this.paceMileInSeconds); // 'mm:ss'/mile
    }
  }

  class CriticalSpeed {
    constructor(resultDistanceInKm, resultTimeInSeconds) {
      this.raceDistance = resultDistanceInKm; //km
      this.raceTime = resultTimeInSeconds; //s
      // critical speed based on race duration
      this.csTmin = 30 * 60; // s
      this.csTmax = 40 * 60; // s
      this.paceMinInSeconds = predictV2Riegel(
        this.raceDistance,
        this.raceTime,
        this.csTmin
      ); // s/km
      this.paceMaxInSeconds = predictV2Riegel(
        this.raceDistance,
        this.raceTime,
        this.csTmax
      ); // s/km
      this.paceMin400InSeconds = this.paceMinInSeconds * 0.4; //(s/400m)
      this.paceMax400InSeconds = this.paceMaxInSeconds * 0.4; //(s/400m)
      this.paceMinMileInSeconds = this.paceMinInSeconds * 1.609; //(s/mile)
      this.paceMaxMileInSeconds = this.paceMaxInSeconds * 1.609; //(s/mile)
      this.speedMin = 1000 / this.paceMinInSeconds; //(m/s)
      this.speedMax = 1000 / this.paceMaxInSeconds; //(m/s)
      this.paceMin = convertNumToTime(this.paceMinInSeconds); // 'mm:ss'/km
      this.paceMax = convertNumToTime(this.paceMaxInSeconds); // 'mm:ss'/km
      this.pace400Min = convertNumToTime(this.paceMin400InSeconds); // 'mm:ss'/km
      this.pace400Max = convertNumToTime(this.paceMax400InSeconds); // 'mm:ss'/km
      this.paceMileMin = convertNumToTime(this.paceMinMileInSeconds); // 'mm:ss'/km
      this.paceMileMax = convertNumToTime(this.paceMaxMileInSeconds); // 'mm:ss'/km
    }
  }

  class CriticalSpeed2Point {
    constructor(distance1, time1, distance2, time2) {
      this.distance1 = distance1; // km
      this.time1 = time1; // s
      this.distance2 = distance2; // km
      this.time2 = time2; // s
      const { cs, Dprime } = calculateCriticalSpeedAndDPrime(
        this.distance1,
        this.time1,
        this.distance2,
        this.time2
      );
      this.cs = cs; // m/s
      this.Dprime = Dprime; // m
      this.paceInSeconds = 1000 / this.cs; // s/km
      this.pace = convertNumToTime(this.paceInSeconds); // 'mm:ss'/km
      this.pace400InSeconds = this.paceInSeconds * 0.4; // s/400m
      this.pace400 = convertNumToTime(this.pace400InSeconds); // 'mm:ss'/400m
      this.paceMileInSeconds = this.paceInSeconds * 1.609; // s/mile
      this.paceMile = convertNumToTime(this.paceMileInSeconds); // 'mm:ss'/mile
      this.kph = this.cs * 3.6; // km/h
      this.DprimeMile = this.Dprime / 1609; // miles
      this.paceVariabilityRange = 2; // s/km +/- this nominal value from the calculated pace
      // critical speed ranges for display
      this.paceMinInSeconds = this.paceInSeconds - 2; // s/km
      this.paceMaxInSeconds = this.paceInSeconds + 2; // s/km
      this.paceMin400InSeconds = this.paceMinInSeconds * 0.4; //(s/400m)
      this.paceMax400InSeconds = this.paceMaxInSeconds * 0.4; //(s/400m)
      this.paceMinMileInSeconds = this.paceMinInSeconds * 1.609; //(s/mile)
      this.paceMaxMileInSeconds = this.paceMaxInSeconds * 1.609; //(s/mile)
      this.speedMin = 1000 / this.paceMinInSeconds; //(m/s)
      this.speedMax = 1000 / this.paceMaxInSeconds; //(m/s)
      this.paceMin = convertNumToTime(this.paceMinInSeconds); // 'mm:ss'/km
      this.paceMax = convertNumToTime(this.paceMaxInSeconds); // 'mm:ss'/km
      this.pace400Min = convertNumToTime(this.paceMin400InSeconds); // 'mm:ss'/km
      this.pace400Max = convertNumToTime(this.paceMax400InSeconds); // 'mm:ss'/km
      this.paceMileMin = convertNumToTime(this.paceMinMileInSeconds); // 'mm:ss'/km
      this.paceMileMax = convertNumToTime(this.paceMaxMileInSeconds); // 'mm:ss'/km
    }
  }

  class TrainingZone {
    constructor(zone, criticalSpeedMin, criticalSpeedMax) {
      this.zone = zone;
      this.csMin = criticalSpeedMin; // s/km
      this.csMax = criticalSpeedMax; // s/km
      // training zone ranges as percentages of CS
      this.pctCS = {};
      this.pctCS["E"] = { min: 1.15, max: 1.24 };
      this.pctCS["R"] = { min: 1.24 };
      this.pctCS["Tempo"] = { min: 1.05, max: 1.15 };
      this.pctCS["T"] = { min: 0.95, max: 1.05 };
      this.pctCS["VO2Max"] = { min: 0.84, max: 0.95 };
      this.pctCS["AnC"] = { max: 0.84 };
      // calculate training paces
      this.paceMinInSeconds = isNaN(this.csMin * this.pctCS[this.zone]["min"])
        ? 0
        : this.csMin * this.pctCS[this.zone]["min"]; //(s/km)
      this.paceMaxInSeconds = this.csMax * this.pctCS[this.zone]["max"]; //(s/km)
      this.pace400MinInSeconds = this.paceMinInSeconds * 0.4; //(s/400m)
      this.pace400MaxInSeconds = this.paceMaxInSeconds * 0.4; //(s/400m)
      this.paceMileMinInSeconds = this.paceMinInSeconds * 1.609; //(s/mile)
      this.paceMileMaxInSeconds = this.paceMaxInSeconds * 1.609; //(s/mile)
      this.paceMin = convertNumToTime(this.paceMinInSeconds); //(s/km)
      this.paceMax = convertNumToTime(this.paceMaxInSeconds); //(s/km)
      this.pace400Min = convertNumToTime(this.pace400MinInSeconds); //(s/km)
      this.pace400Max = convertNumToTime(this.pace400MaxInSeconds); //(s/km)
      this.paceMileMin = convertNumToTime(this.paceMileMinInSeconds); // 'mm:ss'/mile
      this.paceMileMax = convertNumToTime(this.paceMileMaxInSeconds); // 'mm:ss'/mile
      this.speedMin = 1000 / this.paceMaxInSeconds; //(m/s)
      this.speedMax = 1000 / this.paceMinInSeconds; //(m/s)
    }
  }

  // set distance and time from form input
  var resultDistanceInKm = document.getElementById("distance").value;
  var resultTimeInSeconds =
    document.getElementById("timeHH").value * 60 * 60 +
    document.getElementById("timeMM").value * 60 +
    document.getElementById("timeSS").value * 1;
  var customRaceDistance = document.getElementById("customDistance").value;

  /////////////////////////////////////
  // critical speed estaimted based on race duration
  var criticalSpeedRaceResult = new CriticalSpeed(
    resultDistanceInKm,
    resultTimeInSeconds
  );

  /////////////////////////////////////
  // critical speed 2 point calculator
  // set distance and time from from input
  var distance1 = document.getElementById("CSdistance1").value * 1000; // convert from km to m
  var time1 =
    document.getElementById("CStime1MM").value * 60 +
    document.getElementById("CStime1SS").value * 1;
  var distance2 = document.getElementById("CSdistance2").value * 1000; // convert from km to m
  var time2 =
    document.getElementById("CStime2MM").value * 60 +
    document.getElementById("CStime2SS").value * 1;

  // critical speed based on 2 results
  var criticalSpeed2Point = new CriticalSpeed2Point(
    distance1,
    time1,
    distance2,
    time2
  );

  /////////////////////////////////////
  // select Critical Speed between criticalSpeedRaceResult and criticalSpeed2Point based on criticalSpeedRadio.checked
  // where:
  const criticalSpeedRadio = document.getElementById("criticalSpeedRadio");
  var useCriticalSpeed = criticalSpeedRadio.checked ? true : false;
  var criticalSpeed = useCriticalSpeed
    ? criticalSpeed2Point
    : criticalSpeedRaceResult;

  // if using race result and not critical speed, show race pace
  if (!useCriticalSpeed) {
    const result = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      resultDistanceInKm
    );
    updateElementById("raceDistance", result.distance);
    updateElementById("raceTime", result.time);
    updateElementById("racePace", result.pace);
    updateElementById("racePace400", result.pace400);
    updateElementById("racePaceMile", result.paceMile);
    updateElementById("raceSpeed", result.speed.toFixed(1));
  } else {
  }

  // training zones
  let trainingZones = {};
  trainingZones["R"] = new TrainingZone(
    "R",
    criticalSpeed.paceMinInSeconds,
    criticalSpeed.paceMaxInSeconds
  );
  trainingZones["E"] = new TrainingZone(
    "E",
    criticalSpeed.paceMinInSeconds,
    criticalSpeed.paceMaxInSeconds
  );
  trainingZones["Tempo"] = new TrainingZone(
    "Tempo",
    criticalSpeed.paceMinInSeconds,
    criticalSpeed.paceMaxInSeconds
  );
  trainingZones["T"] = new TrainingZone(
    "T",
    criticalSpeed.paceMinInSeconds,
    criticalSpeed.paceMaxInSeconds
  );
  trainingZones["VO2Max"] = new TrainingZone(
    "VO2Max",
    criticalSpeed.paceMinInSeconds,
    criticalSpeed.paceMaxInSeconds
  );
  trainingZones["AnC"] = new TrainingZone(
    "AnC",
    criticalSpeed.paceMinInSeconds,
    criticalSpeed.paceMaxInSeconds
  );

  // race predictions
  let racePredictions = {};
  if (useCriticalSpeed) {
    racePredictions["M"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      42.2
    );
    racePredictions["30K"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      30
    );
    racePredictions["HM"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      21.1
    );
    racePredictions["10K"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      10
    );
    racePredictions["5K"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      5
    );
    racePredictions["3K"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      3
    );
    racePredictions["Mile"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      1.609
    );
    racePredictions["1500"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      1.5
    );
    racePredictions["1000"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      1
    );
    racePredictions["800"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      0.8
    );
    racePredictions["Custom"] = new RacePredictionUsingCriticalSpeed(
      criticalSpeed,
      customRaceDistance
    );
  } else {
    racePredictions["M"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      42.2
    );
    racePredictions["30K"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      30
    );
    racePredictions["HM"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      21.1
    );
    racePredictions["10K"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      10
    );
    racePredictions["5K"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      5
    );
    racePredictions["3K"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      3
    );
    racePredictions["Mile"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      1.609
    );
    racePredictions["1500"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      1.5
    );
    racePredictions["1000"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      1
    );
    racePredictions["800"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      0.8
    );
    racePredictions["Custom"] = new RacePrediction(
      resultDistanceInKm,
      resultTimeInSeconds,
      customRaceDistance
    );
  }

  // output
  // update training pace element for each training zone
  updateTrainingZoneElements(trainingZones);
  updateRacePredictionElements(racePredictions);

  updateElementById("CSPaceMin", criticalSpeed.paceMin);
  updateElementById("CSPaceMax", criticalSpeed.paceMax);
  updateElementById("CS400Min", criticalSpeed.pace400Min);
  updateElementById("CS400Max", criticalSpeed.pace400Max);
  updateElementById("CSMileMin", criticalSpeed.paceMileMin);
  updateElementById("CSMileMax", criticalSpeed.paceMileMax);
  updateElementById("CSMin", criticalSpeed.speedMin.toFixed(1));
  updateElementById("CSMax", criticalSpeed.speedMax.toFixed(1));

  //////////////////////////
  // track calculator
  // set distance and time from from input
  var trackDistance = document.getElementById("trackDistance").value;
  var trackTime =
    document.getElementById("trackTimeMM").value * 60 +
    document.getElementById("trackTimeSS").value * 1;
  var trackLane = document.getElementById("laneSelect").value * 1;

  // training zones
  let trackSplits = {};
  let trackRows = [
    "-3",
    "-2.5",
    "-2",
    "-1.5",
    "-1",
    "-0.5",
    "0",
    "0.5",
    "1",
    "1.5",
    "2",
    "2.5",
    "3",
  ];
  trackRows.forEach(function (item, index) {
    trackSplits[item] = new TrackSplit(
      trackDistance,
      trackTime,
      item * 1.0,
      trackLane * 1.0
    );
  });

  // output
  // update track splits table elements
  trackRows.forEach(function (item, index) {
    updateElementById("track_" + item + "_400", trackSplits[item].split400);
    updateElementById(
      "track_" + item + "_lane",
      trackSplits[item].splitLaneSelect
    );
    updateElementById("track_" + item + "_1000", trackSplits[item].split1000);
    updateElementById("track_" + item + "_mile", trackSplits[item].splitMile);
    updateElementById(
      "track_" + item + "_speed",
      trackSplits[item].speed.toFixed(1)
    );
  });

  /////////////////////////////////////
  // critical speed 2 point calculator
  // set distance and time from from input
  var distance1 = document.getElementById("CSdistance1").value * 1000; // convert from km to m
  var time1 =
    document.getElementById("CStime1MM").value * 60 +
    document.getElementById("CStime1SS").value * 1;
  var distance2 = document.getElementById("CSdistance2").value * 1000; // convert from km to m
  var time2 =
    document.getElementById("CStime2MM").value * 60 +
    document.getElementById("CStime2SS").value * 1;

  // critical speed based on 2 results
  var criticalSpeed2Point = new CriticalSpeed2Point(
    distance1,
    time1,
    distance2,
    time2
  );

  updateElementById("CSPace", criticalSpeed2Point.pace);
  updateElementById("CS400", criticalSpeed2Point.pace400);
  updateElementById("CSMile", criticalSpeed2Point.paceMile);
  updateElementById("CS", criticalSpeed2Point.cs.toFixed(1));
  updateElementById("CSkph", criticalSpeed2Point.kph.toFixed(1));
  updateElementById("Dprime", criticalSpeed2Point.Dprime.toFixed(0));

  // Make sure to attach these values to the window object if needed elsewhere
  // window.cs = cs;
  // window.yIntercept = yIntercept;

  // Call the plot function
  plotSpeedDurationChart(criticalSpeed2Point.cs, criticalSpeed2Point.Dprime);
  plotPaceDurationChart(criticalSpeed2Point.cs, criticalSpeed2Point.Dprime);
}

class TrackSplit {
  constructor(trackDistance, trackTime, offset, lane) {
    this.trackDistance = trackDistance; //m
    this.trackTime = trackTime; //s
    this.trackLane = lane; //s
    this.laneOffset = 7.67; //m
    // calc track splits
    // console.log(offset*1.0)
    this.split400InSeconds = (trackTime / trackDistance) * 400 + offset * 1.0; // s
    this.splitLaneSelectInSeconds =
      (this.split400InSeconds / 400) * (400 + (lane - 1) * this.laneOffset); // s
    this.split1000InSeconds = (this.split400InSeconds / 400) * 1000; // s
    this.splitMileInSeconds = (this.split400InSeconds / 400) * 1609; // s
    this.split400 = convertNumToTime(this.split400InSeconds); // 'mm:ss'
    this.splitLaneSelect = convertNumToTime(this.splitLaneSelectInSeconds); // 'mm:ss'
    this.split1000 = convertNumToTime(this.split1000InSeconds); // 'mm:ss'
    this.splitMile = convertNumToTime(this.splitMileInSeconds); // 'mm:ss'
    this.speed = 1000 / this.split1000InSeconds; //(m/s)
  }
}

function predictT2Riegel(D1, D2, T1) {
  // Riegel formula for race time prediction:
  // T2 = T1 x (D2/D1)^1.06
  // https://en.wikipedia.org/wiki/Peter_Riegel
  T2 = T1 * (D2 / D1) ** 1.06;
  return T2;
}

function predictD2Riegel(D1, T1, T2) {
  // Riegel formula for race time prediction:
  // T2 = T1 x (D2/D1) ^1.06
  // https://en.wikipedia.org/wiki/Peter_Riegel
  // Rearranging the Rigel formula above for distance
  // D2 = D1 x (T2/T1)^0.943
  D2 = D1 * (T2 / T1) ** 0.943;
  return D2;
}

function predictV2Riegel(D1, T1, T2) {
  // Riegel formula for race time prediction:
  // T2 = T1 x (D2/D1)^1.06
  // https://en.wikipedia.org/wiki/Peter_Riegel
  // Rearranging the Rigel formula above for pace [time/distance]
  // V2 = (T2)/(D1*(T2/T1)^0.943)
  V2 = T2 / predictD2Riegel(D1, T1, T2);
  return V2;
}

function convertNumToTime(number) {
  // 'number' represents duration in seconds
  // returns string "hh:mm:ss" if number >= 1 hour or "mm:ss" if < 1 hour or "mm:ss.ms" if <2min

  // Check sign of given number
  var sign = number >= 0 ? 1 : -1;

  // Set positive value of number of sign negative
  number = number * sign;

  // Separate the hours, minutes, seconds
  var hour = Math.floor(number / 3600);
  var minute = Math.floor(number / 60) - hour * 60;
  var second = Math.floor(number) - hour * 3600 - minute * 60;
  var ms = (number - hour * 3600 - minute * 60 - second) * 10;

  // Add padding if needed
  if (minute.toString().length < 2) {
    minute = "0" + minute;
  }

  if (second.toString().length < 2) {
    second = "0" + second;
  }

  // Add Sign in final result
  sign = sign == 1 ? "" : "-";

  if (hour == 0) {
    // if 2min or longer
    if (minute > 1) {
      // Concatenate minutes and seconds 'mm:ss'
      time = sign + minute + ":" + second;
    } else {
      // Concatenate minutes seconds and ms 'mm:ss.ms'
      time = sign + minute + ":" + second + "." + ms.toFixed(0);
    }
  } else {
    // Concatenate hours, minutes and seconds 'hh:mm:ss'
    time = sign + hour + ":" + minute + ":" + second;
  }

  return time;
}

function updateElementById(id, value, dp = 0) {
  try {
    // if string
    if (typeof value === "string") {
      // if NaN in string
      if (value.includes("NaN") || value.includes("Infinity")) {
        var cleanedValue = "...";
      } else {
        var cleanedValue = value;
      }
    }
    // if not string
    else {
      // if NaN
      if (isNaN(value)) {
        var cleanedValue = "  ";
      }
      // if finite
      else if (isFinite(value)) {
        var cleanedValue = value;
      }
      // if infinity
      else {
        var cleanedValue = "  ";
      }
    }
    document.getElementById(id).innerHTML = cleanedValue;
  } catch (err) {
    console.log(err);
  }
}

function updateTrainingZoneElements(trainingZones) {
  // update training pace element for each training zone

  const trainingPaceMinElements = document.querySelectorAll(
    `[id^="trainingPaceMin_"]`
  );
  trainingPaceMinElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].paceMin);
  });
  const trainingPaceMaxElements = document.querySelectorAll(
    `[id^="trainingPaceMax_"]`
  );
  trainingPaceMaxElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].paceMax);
  });
  // update training 400m pace element for each training zone
  const trainingPace400MinElements = document.querySelectorAll(
    `[id^="trainingPace400Min_"]`
  );
  trainingPace400MinElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].pace400Min);
  });
  const trainingPace400MaxElements = document.querySelectorAll(
    `[id^="trainingPace400Max_"]`
  );
  trainingPace400MaxElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].pace400Max);
  });

  // update training pace/mile element for each training zone
  const trainingPaceMileMinElements = document.querySelectorAll(
    `[id^="trainingPaceMileMin_"]`
  );
  trainingPaceMileMinElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].paceMileMin);
  });
  const trainingPaceMileMaxElements = document.querySelectorAll(
    `[id^="trainingPaceMileMax_"]`
  );
  trainingPaceMileMaxElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].paceMileMax);
  });

  // update training speed element for each training zone
  const trainingSpeedMinElements = document.querySelectorAll(
    `[id^="trainingSpeedMin_"]`
  );
  trainingSpeedMinElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].speedMin.toFixed(1));
  });
  const trainingSpeedMaxElements = document.querySelectorAll(
    `[id^="trainingSpeedMax_"]`
  );
  trainingSpeedMaxElements.forEach((item) => {
    const tz = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, trainingZones[tz].speedMax.toFixed(1));
  });
}

function updateRacePredictionElements(racePredictions) {
  // update predicted time element for each race distance
  const raceTimeElements = document.querySelectorAll(`[id^="raceTime_"]`);
  raceTimeElements.forEach((item) => {
    raceDistance = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, racePredictions[raceDistance].time);
  });

  // update predicted pace element for each race distance
  const racePaceElements = document.querySelectorAll(`[id^="racePace_"]`);
  racePaceElements.forEach((item) => {
    raceDistance = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, racePredictions[raceDistance].pace);
  });

  // update predicted 400m pace element for each race distance
  const racePace400Elements = document.querySelectorAll(`[id^="racePace400_"]`);
  racePace400Elements.forEach((item) => {
    raceDistance = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, racePredictions[raceDistance].pace400);
  });

  // update predicted pace/mile element for each race distance
  const racePaceMileElements = document.querySelectorAll(
    `[id^="racePaceMile_"]`
  );
  racePaceMileElements.forEach((item) => {
    raceDistance = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, racePredictions[raceDistance].paceMile);
  });

  // update predicted speed element for each race distance
  const raceSpeedElements = document.querySelectorAll(`[id^="raceSpeed_"]`);
  raceSpeedElements.forEach((item) => {
    raceDistance = item.id.substring(item.id.search("_") + 1);
    updateElementById(item.id, racePredictions[raceDistance].speed.toFixed(1));
  });
}

function calculateCriticalSpeedAndDPrime(
  distance1Meters,
  time1InSeconds,
  distance2Meters,
  time2InSeconds
) {
  // Calculate speeds (m/s)
  const speed1 = distance1Meters / time1InSeconds;
  const speed2 = distance2Meters / time2InSeconds;

  // Calculate Critical Speed (CS) and D'
  // Calculate the slope of distance over time between the two points
  const deltaDistance = distance2Meters - distance1Meters;
  const deltaTime = time2InSeconds - time1InSeconds;
  const cs = deltaDistance / deltaTime;
  //const cs = (speed1 * speed2 * (time2InSeconds - time1InSeconds)) / (speed1 * time2InSeconds - speed2 * time1InSeconds);
  // Calculate the y-intercept (b)
  const Dprime = distance1Meters - cs * time1InSeconds;
  //const Dprime = (speed1 - cs) * time1InSeconds;

  return { cs, Dprime };
}
