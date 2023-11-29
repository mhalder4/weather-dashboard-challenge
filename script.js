const searchElem = $("#city-search");
const searchBtnElem = $(".search-btn");
const searchBoxElem = $(".search-box");


async function getCityLatLon(city) {
  console.log("Searching");

  const query = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},&limit=15&appid=845c2648c2666da634c7f3ee545634ac`)
  const result = await query.json();
  console.log(result);

  return result;
}

async function displaySearchedCities(city) {
  let cities = await getCityLatLon(city);

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

  console.log(middays);
}

async function test(e) {
  const data = $(e.target.dataset)[0];
  const coords = { ...data };

  const weather = await getCityWeather(coords.lat, coords.lon);

  // console.log(weather.city)

  const gmtNoons = [weather.list[3].dt, weather.list[11].dt, weather.list[19].dt, weather.list[27].dt, weather.list[35].dt,];
  console.log(gmtNoons);

  calculateNoon(weather.city.timezone, gmtNoons);
}

async function getCityWeather(lat, lon) {
  const query = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=845c2648c2666da634c7f3ee545634ac&units=imperial`)
  const result = await query.json();
  console.log(result);

  return result;
}

// http://openweathermap.org/img/w/01n.png

// async function getWeatherData() {
//   const query = await fetch("Weather api link")
//   const result = await query.json();
// }

getCityLatLon();

searchBtnElem.on("click", () => displaySearchedCities(searchElem.val()));
searchBoxElem.on("click", ".city-btn", test)