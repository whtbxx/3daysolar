function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(displayForecast, showError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  } else {
    document.getElementById("location-output").innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showError(error) {
  let message = "";
  switch(error.code) {
    case error.PERMISSION_DENIED:
      message = "User denied the request for Geolocation.";
      html_message = "<small>Your location is required so that accurate forecast data can be provided. \
        Refresh the page if you want to allow this website to access your location.</small>";
      break;
    case error.POSITION_UNAVAILABLE:
      message = "Location information is unavailable.";
      html_message = "<small>Your location is unavailable. \
        Refresh the page if you want to allow this website to access your location.</small>";
      break;
    case error.TIMEOUT:
      message = "The request to get user location timed out.";
      html_message = "<small>Your location is unavailable. \
        Refresh the page if you want to allow this website to access your location.</small>";
      break;
    case error.UNKNOWN_ERROR:
      message = "An unknown error occurred.";
      html_message = "<small>Something went wrong!  Your location is unavailable. \
        Refresh the page if you want to allow this website to access your location.</small>";
      break;
  }
  document.getElementById("three_day_article").ariaBusy = "false";
  document.getElementById("seven_day_article").ariaBusy = "false";
  document.getElementById("three_day_article").innerHTML = html_message;
  document.getElementById("seven_day_article").innerHTML = html_message;
}

async function displayForecast(position){
  const threeDayData = await get3DayData(position);
  const sevenDayData = await get7DayData(position);

  document.getElementById("three_day_article").innerHTML = "<canvas id=\"three_day_chart\"></canvas>";
  document.getElementById("seven_day_article").innerHTML = "<canvas id=\"seven_day_chart\"></canvas>";

  create_3day_chart(threeDayData);
  document.getElementById("three_day_article").ariaBusy = "false";

  create_7day_chart(sevenDayData);
  document.getElementById("seven_day_article").ariaBusy = "false";

}

async function get3DayData(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=shortwave_radiation&forecast_days=3`;

  // Make the HTTP GET request
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json(); // Parse response as JSON
  const dates = data.hourly.time;
  const radiationValues = data.hourly.shortwave_radiation;

  const dataset = {x: dates, y:radiationValues};
  return dataset;

}

async function get7DayData(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=shortwave_radiation_sum&timezone=Europe%2FLondon`;

  // Make the HTTP GET request
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json(); // Parse response as JSON
  const dates = data.daily.time;
  const radiationValues = data.daily.shortwave_radiation_sum;

  // convert to kWh
  const converted_data = radiationValues.map(mj => +(mj * 0.27778).toFixed(2));

  const dataset = {x: dates, y:converted_data};
  return dataset;

}

function create_3day_chart(dataset1){

  const dates = dataset1.x;
  const radiationValues = dataset1.y;

  const now = new Date();
  const hours = [];

  dates.forEach((d, index) => {
    date = new Date(d);
    if(date.getDate() === now.getDate() && date.getHours() === now.getHours()){
      hours.push('now');
    } else {
      hours.push(date.getHours()); 
    }
  });

  new Chart("three_day_chart", {
    type: "bar",
    data: {
      datasets: [{
        label: 'Forecast GHI (W/m2)',
        data: radiationValues,
        backgroundColor: '#524ED2'
      }],
      labels:hours
    },
    options: {
      legend: {
        display: true,
      },
      scales: {
        yAxes: [{
          ticks: {
            min: 0,
            max: 1200,
          }
        }]
      },
    }
  });
}

function create_7day_chart(dataset1){

  const dates = dataset1.x;
  const radiationValues = dataset1.y;

  const now = new Date();
  const hours = [];

  new Chart("seven_day_chart", {
    type: "bar",
    data: {
      datasets: [{
        label: 'Forecast GHI (kWh/m2)',
        data: radiationValues,
        backgroundColor: '#D92662'
      }],
      labels:dates
    },
    options: {
      legend: {
        display: true,
      },
      scales: {
        yAxes: [{
          ticks: {
            min: 0,
            max: 10,
          }
        }]
      },
    }
  });
}


