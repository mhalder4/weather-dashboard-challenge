const searchElem = $("#city-search");
const searchBtnElem = $(".search-btn");
const searchBoxElem = $(".search-box");
const cityTextElem = $(".city-text");
const weatherTodayElem = $(".weather-today");
const weatherForecastElem = $(".weather-forecast");
const prevSearchesElem = $(".prev-searches");
const allSearchesElem = $(".all-searches");

let prevSearches = [];

loadLocalStorage();

// Loads local storage and renders previous searches
function loadLocalStorage() {
  var tempSearches = JSON.parse(localStorage.getItem("prevSearches"));
  if (tempSearches !== null) {
    tempSearches.forEach(function (object) {
      prevSearches.push(object);
    });

    renderPrevSearches();
  }
}

// Updates local storage
function updateLocalStorage() {
  manageLocalStorage();
  localStorage.setItem("prevSearches", JSON.stringify(prevSearches));
}

// Keeps only the 10 most recent searches
function manageLocalStorage() {
  if (prevSearches.length > 10) prevSearches = prevSearches.slice(1);
}

// API call to get the cityy's lat and lon
async function getCityLatLon(city) {
  try {
    const query = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},&limit=15&appid=845c2648c2666da634c7f3ee545634ac`)
    const result = await query.json();

    if (result.cod === "400") {
      throw new Error("There is not a city with that name in the API database.");
    }

    return result;

  } catch (err) {
    alert(err);
  }
}

// API call to get weather based on lat and lon
async function getCityWeather(lat, lon) {
  const forecastQuery = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=845c2648c2666da634c7f3ee545634ac&units=imperial`)
  const forecastResult = await forecastQuery.json();

  const weatherQuery = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=845c2648c2666da634c7f3ee545634ac&units=imperial`)
  const weatherResult = await weatherQuery.json();

  const data = {
    name: forecastResult.city.name,
    forecast: forecastResult,
    current: weatherResult
  }

  return data;
}

// Does caluclations so the 5 UNIX timestamps looked for from the API calls are the forecasts for the time around midday in the searched city
async function calculateNoon(timezone, noons) {
  const nearestHour = Math.round(timezone / 10800)
  const newTimezone = nearestHour * 10800;
  const middays = noons.map(item => {
    return item - newTimezone;
  })

  return middays;
}

// Gathers all the necessary data for the city button that is clicked on and combines it into a single object
async function coalesceWeatherData(e) {
  const data = $(e.target.dataset)[0];
  const coords = { ...data };

  const info = await getCityWeather(coords.lat, coords.lon);
  const forecast = info.forecast.list;

  const fiveDayWeather = await handleForecast(forecast, info.forecast.city.timezone);

  const todayWeather = retrieveInfo(info.current);

  const allWeather = {
    today: todayWeather,
    fiveDay: fiveDayWeather
  }

  return allWeather;
}

// Finds the relevant forecasts and return the weather data
async function handleForecast(forecast, timezone) {
  // These five array items from the API are always noon in GMT for the next five days
  const gmtNoons = [forecast[3].dt, forecast[11].dt, forecast[19].dt, forecast[27].dt, forecast[35].dt,];

  const timesArr = await calculateNoon(timezone, gmtNoons);

  let fiveDay = [];

  timesArr.forEach(time => {
    forecast.find((item) => {
      if (item.dt === time) {
        const oneDay = retrieveInfo(item);

        fiveDay.push(oneDay);
      }
    })
  })

  return fiveDay;
}

// Retrieves the actually useful weather data from a timepoint
function retrieveInfo(item) {
  const date = dayjs.unix(item.dt).format("dddd, MM/DD/YYYY");

  const weatherInfo = {
    date: date,
    icon: item.weather[0].icon,
    temp: item.main.temp,
    wind: item.wind.speed,
    humidity: item.main.humidity
  }

  return weatherInfo;


}

// Renders the previous searches
function renderPrevSearches() {
  prevSearchesElem.empty()
  updateLocalStorage();

  for (var i = prevSearches.length - 1; i >= 0; i--) {
    prevSearchesElem.append(prevSearches[i]);
  }
}

// Renders all the weather data
async function renderWeather(e) {
  const weather = await coalesceWeatherData(e);
  const { today, fiveDay } = weather;
  const name = e.target.innerText;
  const todayIcon = getIconURL(today.icon);

  cityTextElem.text(name);

  renderCurrentWeather(today, todayIcon);
  renderForecast(fiveDay);

  const search = e.target.outerHTML;
  const parent = $(e.target).parent();
  const parentClass = parent[0].className;

  if (parentClass === "search-box") {
    prevSearches.push(search);
    renderPrevSearches();
  }
}

// Gets the weather icon from url for that forecast
function getIconURL(icon) {
  return `https://openweathermap.org/img/w/${icon}.png`
}

// Renders the current weather
function renderCurrentWeather(today, icon) {
  weatherTodayElem.empty();

  weatherTodayElem.append(`
  <div class="card col-12 m-3">
  <div class="card-body">
  <h5 class="card-title date">${today.date}</h5>
  <h6 class="card-subtitle mb-2 text-body-secondary icon"><img src="${icon}" /></h6>
  <p class="card-text">Temp: ${today.temp} &deg;F</p>
  <p class="card-text">Wind: ${today.wind} MPH</p>
  <p class="card-text">Humidity ${today.humidity}%</p>
  </div>
  </div>
  `)
}

// Renders the five day forecast
function renderForecast(fiveDay) {
  weatherForecastElem.empty();

  fiveDay.forEach(day => {
    const icon = getIconURL(day.icon);

    weatherForecastElem.append(`
    <div class="card col-12 m-3">
    <div class="card-body">
    <h5 class="card-title date">${day.date}</h5>
    <h6 class="card-subtitle mb-2 text-body-secondary icon"><img src="${icon}" /></h6>
    <p class="card-text">Temp: ${day.temp} &deg;F</p>
    <p class="card-text">Wind: ${day.wind} MPH</p>
    <p class="card-text">Humidity ${day.humidity}%</p>
    </div>
    </div>
    `)
  })

}

// Shows up to five cities that match the search
async function displaySearchedCities(city) {
  let cities = await getCityLatLon(city);

  searchBoxElem.empty();

  cities.forEach(element => {
    const button = `<button type="button" class="btn btn-light city-btn col-12 mt-3" data-lat="${element.lat}" data-lon="${element.lon}">${element.name}, ${element.state}, ${element.country}</button>`

    searchBoxElem.append(button);
  });
}

allSearchesElem.on("click", ".search-btn", () => displaySearchedCities(searchElem.val()));
allSearchesElem.on("click", ".city-btn", renderWeather)