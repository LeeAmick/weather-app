// Storing the API key for OpenWeatherMap
const apiKey = "";

// URL for making API requests
let queryURL = "https://api.openweathermap.org/data/2.5/weather?";

// Function to render buttons to the page from storage
function renderButtons() {
  // Clearing the existing buttons
  $(".btn-group-vertical").text("");

  // Retrieving data from local storage
  let localStorageDataToRender = JSON.parse(localStorage.getItem("recentCitiesData"));

  if (localStorageDataToRender === null) {
    return;
  } else {
    // Rendering up to 10 recent cities
    let howManyToRender = Math.min(10, localStorageDataToRender.length);

    for (let i = 0; i < howManyToRender; i++) {
      let cityNameToRender = localStorageDataToRender[i].cityNameStorage;
      const newBtnCity = $("<button>")
        .addClass("btn btn-secondary m-2 rounded-3")
        .text(cityNameToRender);
      $(".btn-group-vertical").append(newBtnCity);
    }
  }
}

// Function to store city details in local storage
function storeCity(cityNameInput, countryName) {
  let cityDetails = {
    cityNameStorage: cityNameInput + ", " + countryName,
    dateTimeStored: dayjs().format("M/D/YYYY, H:m:s"),
  };

  let localStorageData = JSON.parse(localStorage.getItem("recentCitiesData"));

  if (localStorageData === null) {
    localStorageData = [];
  } else {
    for (let k = 0; k < localStorageData.length; k++) {
      if (localStorageData[k].cityNameStorage === cityDetails.cityNameStorage) {
        localStorageData.splice(k, 1);
      }
    }
  }

  localStorageData.unshift(cityDetails);
  localStorage.setItem("recentCitiesData", JSON.stringify(localStorageData));

  renderButtons();
}

// Function to determine weather icon based on weather condition
function checkForIcon(iconID) {
  switch (true) {
    case iconID >= 200 && iconID <= 232:
      return "🌩️";
    case iconID >= 300 && iconID <= 321:
      return "🌦️";
    case iconID >= 500 && iconID <= 531:
      return "🌧️";
    case iconID >= 600 && iconID <= 622:
      return "❄️";
    case iconID >= 701 && iconID <= 781:
      return "🌫️";
    case iconID === 801:
      return "⛅";
    case iconID >= 802 && iconID <= 804:
      return "☁️";
    default:
      return "☀️";
  }
}

// Function to render five-day forecast
async function renderFiveDays(latInfoPassed, lonInfoPassed) {
  // Constructing URL for forecast API request
  let getForecastURL =
    "https://api.openweathermap.org/data/2.5/forecast?lat=" +
    latInfoPassed +
    "&lon=" +
    lonInfoPassed +
    "&units=imperial&appid=" +
    apiKey;

  // Making the forecast API request
  const responseTwo = await fetch(getForecastURL);
  let dataTwo = await responseTwo.json();

  // Finding the index for the next day in the forecast data
  let indexOfNextDay = 0;
  for (let j = 0; j < dataTwo.list.length; j++) {
    if (dataTwo.list[j].dt_txt === timeOfReadNextDay) {
      indexOfNextDay = j;
    }
  }

  const sectionForecast = $("#five-day-forecast");
  sectionForecast.text("");

  const headerFiveDay = $("<h3>");
  sectionForecast.append(headerFiveDay);

  let daysToDisplay;

  if (indexOfNextDay === 8) {
    daysToDisplay = 4;
    headerFiveDay.text(
      "4-Day Forecast (currently available due to local time of the read):"
    );
  } else {
    daysToDisplay = 5;
    headerFiveDay.text("5-Day Forecast:");
  }

  sectionForecast.append(headerFiveDay);

  const allCards = $("<section>").addClass("row d-flex justify-content-evenly");

  // Looping through the forecast data to display information for each day
  for (indexOfNextDay; daysToDisplay > 0; indexOfNextDay = indexOfNextDay + 8) {
    let dateNEW = dataTwo.list[indexOfNextDay].dt_txt.split(" ")[0];
    let reformatedDate = dayjs(dateNEW).format("MMM DD, YYYY");

    let tempForecast = Math.round(dataTwo.list[indexOfNextDay].main.temp);
    let windForecast = dataTwo.list[indexOfNextDay].wind.speed.toFixed(2);
    let humidityForecast = dataTwo.list[indexOfNextDay].main.humidity;

    let weatherIconForecastID = dataTwo.list[indexOfNextDay].weather[0].id;
    let weatherForecastIcon = checkForIcon(weatherIconForecastID);

    const cardDiv = $("<div>").addClass("mb-3 col-12 col-md-6 col-lg-2 flex-fill");
    const actualCard = $("<div>").addClass("card");
    const cardDate = $("<div>").addClass("card-header").text(reformatedDate + " " + weatherForecastIcon);

    const cardBody = $("<div>").addClass("card-body");
    const tempForecastToDisplay = $("<p>").text("Temperature: " + tempForecast + "°F");
    const humidityForecastToDisplay = $("<p>").text("Humidity: " + humidityForecast + "%");
    const windFOrecastToDisplay = $("<p>").text("Wind: " + windForecast + " MPH");
    cardBody.append(tempForecastToDisplay, humidityForecastToDisplay, windFOrecastToDisplay);
    actualCard.append(cardDate, cardBody);
    cardDiv.append(actualCard);
    allCards.append(cardDiv);

    daysToDisplay--;
  }
  sectionForecast.append(allCards);
}

// Function to check weather for a given city
async function checkWeather(cityInput) {
  // Clearing the current city display
  $("#current-city").text("");

  // Making API request for current weather
  const response = await fetch(queryURL + "q=" + cityInput + "&units=imperial&appid=" + apiKey);
  let data = await response.json();

  if (data.cod === "404" || data.cod === "401" || data.cod === "500" || data.cod === "400") {
    // Handling invalid city name
    alert("Invalid city name");
    location.reload();
  }

  // Extracting relevant weather information
  let latInfo = data.coord.lat;
  let lonInfo = data.coord.lon;

  let cityName = data.name;
  let countryName = data.sys.country;
  let temp = Math.round(data.main.temp);
  let humidity = data.main.humidity;
  let wind = data.wind.speed;
  let timeOfRead = dayjs((data.dt + data.timezone) * 1000).format("MMM DD, YYYY [at] HH:mm a");
  let mainWeather = data.weather[0].main;

  let weatherIconID = data.weather[0].id;
  let weatherIcon = checkForIcon(weatherIconID);

  // Calculating time for next day
  timeOfReadNextDay = dayjs((data.dt + data.timezone) * 1000)
    .add(1, "day")
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");

  // Creating elements to display weather information
  const cityDate = $("<h2>").text(
    cityName + ", " + countryName + " " + weatherIcon + " (" + mainWeather + ")"
  ).addClass("fs-4");

  const readTime = $("<p>").text("(Last read local time: " + timeOfRead + ")");

  const tempToDisplay = $("<p>").text("Temperature: " + temp + "°F");
  const humidityToDisplay = $("<p>").text("Humidity: " + humidity + "%");
  const windToDisplay = $("<p>").text("Wind: " + wind + " MPH");

  // Appending elements to current city section
  $("#current-city").append(
    cityDate,
    readTime,
    tempToDisplay,
    humidityToDisplay,
    windToDisplay
  );

  // Rendering five-day forecast
  renderFiveDays(latInfo, lonInfo);

  // Storing city details in local storage
  storeCity(cityName, countryName);
}

// Rendering buttons on page load
renderButtons();

// Handling form submission for city search
$("#search-form").on("submit", function (e) {
  e.preventDefault();
  let cityInput = $("#search-input").val();
  $("#search-input").val("");
  checkWeather(cityInput);
});

// Handling click on clear history button
$("#clear-history").on("click", function (e) {
  e.preventDefault();
  localStorage.clear();
  location.reload();
});

// Handling click on a city button in history
$(".btn-group-vertical").on("click", ".btn", function (e) {
  e.preventDefault();
  let cityClicked = e.target.innerHTML;
  checkWeather(cityClicked);
});
