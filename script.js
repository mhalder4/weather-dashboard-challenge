
async function getWeatherData() {
  const query = await fetch("Weather api link")
  const result = await query.json();
}