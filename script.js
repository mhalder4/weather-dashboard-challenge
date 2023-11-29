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

function loadLocalStorage() {
  var tempSearches = JSON.parse(localStorage.getItem("prevSearches"));
  if (tempSearches !== null) {
    tempSearches.forEach(function (object) {
      prevSearches.push(object);
    });

    renderPrevSearches();
  }

}

function updateLocalStorage() {
  manageLocalStorage();
  localStorage.setItem("prevSearches", JSON.stringify(prevSearches));
}

function manageLocalStorage() {
  if (prevSearches.length > 10) prevSearches = prevSearches.slice(1);
}

async function getCityLatLon(city) {
  console.log("Searching");

  const query = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},&limit=15&appid=845c2648c2666da634c7f3ee545634ac`)
  const result = await query.json();
  console.log(result);

  return result;
}

async function displaySearchedCities(city) {
  let cities = await getCityLatLon(city);

  searchBoxElem.empty();

  cities.forEach(element => {
    const button = `<button type="button" class="btn btn-light city-btn col-12 mt-3" data-lat="${element.lat}" data-lon="${element.lon}">${element.name}, ${element.state}, ${element.country}</button>`

    searchBoxElem.append(button);
  });
}

async function calculateNoon(timezone, noons) {
  const nearestHour = Math.round(timezone / 10800)
  console.log(nearestHour);

  const newTimezone = nearestHour * 10800;
  console.log(newTimezone);

  const middays = noons.map(item => {
    return item - newTimezone;
  })

  // console.log(middays);
  return middays;
}

async function test(e) {
  const data = $(e.target.dataset)[0];
  const coords = { ...data };

  const info = await getCityWeather(coords.lat, coords.lon);

  console.log(info);

  const forecast = info.forecast.list;

  // console.log(forecast);

  const fiveDayWeather = await handleForecast(forecast, info.forecast.city.timezone);

  // console.log(fiveDay);

  const todayWeather = retrieveInfo(info.current);

  console.log(todayWeather);

  const allWeather = {
    today: todayWeather,
    fiveDay: fiveDayWeather
  }
  console.log(allWeather);

  return allWeather;
}

async function handleForecast(forecast, timezone) {
  const gmtNoons = [forecast[3].dt, forecast[11].dt, forecast[19].dt, forecast[27].dt, forecast[35].dt,];
  // console.log(gmtNoons);

  const timesArr = await calculateNoon(timezone, gmtNoons);

  let fiveDay = [];

  timesArr.forEach(time => {
    forecast.find((item) => {
      if (item.dt === time) {
        const oneDay = retrieveInfo(item);

        fiveDay.push(oneDay);
        // console.log(oneDay);

      }
    })
  })

  // console.log(fiveDay);
  return fiveDay;
}

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

async function getCityWeather(lat, lon) {
  const forecastQuery = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=845c2648c2666da634c7f3ee545634ac&units=imperial`)
  const forecastResult = await forecastQuery.json();
  console.log(forecastResult);

  const weatherQuery = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=845c2648c2666da634c7f3ee545634ac&units=imperial`)
  const weatherResult = await weatherQuery.json();
  console.log(weatherResult);

  const data = {
    name: forecastResult.city.name,
    forecast: forecastResult,
    current: weatherResult
  }

  return data;
}

async function renderWeather(e) {
  const weather = await test(e);
  const { today, fiveDay } = weather;
  const name = e.target.innerText;
  const todayIcon = getIconURL(today.icon);

  cityTextElem.text(name);

  renderCurrentWeather(today, todayIcon);
  renderForecast(fiveDay);

  const search = e.target.outerHTML;
  const parent = $(e.target).parent();
  const parentClass = parent[0].className;

  console.log(typeof (search));

  if (parentClass === "search-box") {
    // prevSearchesElem.empty()
    // prevSearches.push(search);
    // updateLocalStorage();

    // // prevSearches.forEach(item => prevSearchesElem.append(item));
    // for (var i = prevSearches.length - 1; i >= 0; i--) {
    //   prevSearchesElem.append(prevSearches[i]);
    // }
    prevSearches.push(search);
    renderPrevSearches();
  }


  // updateLocalStorage();
}

function renderPrevSearches() {
  prevSearchesElem.empty()
  updateLocalStorage();

  // prevSearches.forEach(item => prevSearchesElem.append(item));
  for (var i = prevSearches.length - 1; i >= 0; i--) {
    prevSearchesElem.append(prevSearches[i]);
  }
}

function getIconURL(icon) {
  return `https://openweathermap.org/img/w/${icon}.png`
}

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

// http://openweathermap.org/img/w/01n.png

// async function getWeatherData() {
//   const query = await fetch("Weather api link")
//   const result = await query.json();
// }

getCityLatLon();

allSearchesElem.on("click", ".search-btn", () => displaySearchedCities(searchElem.val()));
allSearchesElem.on("click", ".city-btn", renderWeather)