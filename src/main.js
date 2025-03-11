import "./reset.css";
import "./style.css";
// core version + navigation, pagination modules:
import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";
// import Swiper and modules styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { API_KEY } from "./secret.js";

// init Swiper:
new Swiper(".swiper", {
  // configure Swiper to use modules
  modules: [Navigation, Pagination],

  // Optional parameters
  direction: "horizontal",
  loop: true,

  // If we need pagination
  pagination: {
    el: ".swiper-pagination",
  },

  // Navigation arrows
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

const cityColors = {
  "New York": "#eac065",
  "Buenos Aires": "blue",
  London: "red",
  Kaapstad: "#f5c9a8",
  Tokyo: "white",
};

function applyCityColors() {
  const slides = document.querySelectorAll(".swiper-slide p");

  slides.forEach((slide) => {
    const cityName = slide.textContent.trim(); // Haal de stadnaam op uit de <p>-tag
    if (cityColors[cityName]) {
      slide.style.color = cityColors[cityName]; // Pas de kleur toe
    }
  });
}

applyCityColors();

const cities = [
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Kaapstad", lat: -33.9249, lon: 18.4241 },
  { name: "Tokyo", lat: 35.682839, lon: 139.759455 },
];

function getWeatherIcon(condition) {
  const icons = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
  };
  return icons[condition] || "❓"; // Standaard vraagteken als het onbekend is
}

async function getWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const temperature = Math.round(data.main.temp); // Afronden van temperatuur
    const weatherCondition = data.weather[0].main; // Haal de algemene weersomstandigheid op
    return { temperature, weatherCondition };
  } catch (error) {
    console.error("Fout bij ophalen van weerdata:", error);
    return { temperature: "N/A", weatherCondition: "Unknown" };
  }
}

async function updateWeather() {
  const slides = document.querySelectorAll(".swiper-slide p");

  cities.forEach(async (city, index) => {
    let tempElement = document.createElement("span");
    tempElement.classList.add("weather-temp"); // Voeg een klasse toe voor styling
    tempElement.textContent = "⏳"; // Toon een loader totdat de data geladen is
    slides[index].appendChild(tempElement);

    const { temperature, weatherCondition } = await getWeather(
      city.lat,
      city.lon,
    );
    const weatherIcon = getWeatherIcon(weatherCondition);

    tempElement.textContent = `${weatherIcon} ${temperature}°C`;
  });
}

// Roep de functie aan zodra de pagina laadt
updateWeather();
