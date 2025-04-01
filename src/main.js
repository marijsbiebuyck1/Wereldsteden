import './reset.css';
import './style.css';
// core version + navigation, pagination modules:
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
// import Swiper and modules styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { API_KEY } from './secret.js';
import * as THREE from 'three';

// init Swiper:
new Swiper('.swiper', {
  // configure Swiper to use modules
  modules: [Navigation, Pagination],

  // Optional parameters
  direction: 'horizontal',
  loop: true,

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});

const cityColors = {
  'New York': '#eac065',
  'Buenos Aires': 'blue',
  London: 'red',
  Kaapstad: '#f5c9a8',
  Tokyo: 'white',
};

function applyCityColors() {
  const slides = document.querySelectorAll('.swiper-slide p');

  slides.forEach((slide) => {
    const cityName = slide.textContent.trim(); // Haal de stadnaam op uit de <p>-tag
    if (cityColors[cityName]) {
      slide.style.color = cityColors[cityName]; // Pas de kleur toe
    }
  });
}

applyCityColors();

const cities = [
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Kaapstad', lat: -33.9249, lon: 18.4241 },
  { name: 'Tokyo', lat: 35.682839, lon: 139.759455 },
];

function getWeatherIcon(condition) {
  const icons = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
  };
  return icons[condition] || '❓'; // Standaard vraagteken als het onbekend is
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
    console.error('Fout bij ophalen van weerdata:', error);
    return { temperature: 'N/A', weatherCondition: 'Unknown' };
  }
}

async function updateWeather() {
  const slides = document.querySelectorAll('.swiper-slide p');

  cities.forEach(async (city, index) => {
    let tempElement = document.createElement('span');
    tempElement.classList.add('weather-temp'); // Voeg een klasse toe voor styling
    tempElement.textContent = '⏳'; // Toon een loader totdat de data geladen is
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

function createGlobe() {
  // Create scene, camera, and renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  scene.background = new THREE.Color(0x00000);

  // Create a container for the globe
  const globeContainer = document.createElement('div');

  globeContainer.style.bottom = '0';
  globeContainer.style.left = '0';
  globeContainer.style.width = '100%';
  globeContainer.style.height = '300px'; // Zet de hoogte van de globe-container
  globeContainer.style.zIndex = '-1'; // Zorg ervoor dat de globe onder de rest van de inhoud komt
  globeContainer.appendChild(renderer.domElement);
  document.body.appendChild(globeContainer);

  // Create globe
  const radius = 5.1; // Aangepaste radius van de bol
  const globeGeometry = new THREE.SphereGeometry(3, 32, 32);
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('public/wereldkaart.jpg', (texture) => {
      const globeMaterial = new THREE.MeshBasicMaterial({ map: texture });
      const globe = new THREE.Mesh(globeGeometry, globeMaterial);
      scene.add(globe);
  });

  // Position camera
  camera.position.z = 10;

  // Function to convert lat/lon to 3D coordinates on a sphere
  function latLonToVector3(lat, lon, radius = 5.1) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      return new THREE.Vector3(
          -radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
      );
  }

  // Create city pins and labels
  async function createCityPins() {
      const cityPinGroup = new THREE.Group();

      for (const city of cities) {
          // Create pin
          const pinGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Pin grootte kan je aanpassen
          const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xADD8E6 });
          const pin = new THREE.Mesh(pinGeometry, pinMaterial);

          // Position pin
          const position = latLonToVector3(city.lat, city.lon, 3);  // Gebruik hier de radius
          pin.position.copy(position);
          cityPinGroup.add(pin);

          // Fetch weather data
          const weatherData = await getWeather(city.lat, city.lon);
          
          // Create label
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = 256;
          canvas.height = 128;
          context.fillStyle = 'rgba(255,255,255,0.8)';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.font = 'Bold 30px Arial';
          context.fillStyle = 'black';
          context.fillText(`${city.name}`, 10, 50);
          context.fillText(`${weatherData.temperature}°C`, 10, 80);

          const labelTexture = new THREE.CanvasTexture(canvas);
          const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
          const label = new THREE.Sprite(labelMaterial);
          label.scale.set(1, 0.5, 1);
          label.position.copy(position.multiplyScalar(1.2));
          cityPinGroup.add(label);
      }

      scene.add(cityPinGroup);
  }

  // Animation loop
  function animate() {
      requestAnimationFrame(animate);
      // Rotate globe and camera manually
      scene.rotation.y += 0.001; // Rotate the globe continuously

      renderer.render(scene, camera);
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Create city pins
  createCityPins();

  // Start animation
  animate();
}

// Call the globe creation function when the page loads
window.addEventListener('load', createGlobe);

// Zoek het element van de wereldbol
const globeContainer = document.getElementById('globe-container');

// Voeg een scroll event listener toe
window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY;

  // Toon de wereldbol wanneer je naar beneden scrolt (bijvoorbeeld na 200px)
  if (scrollPosition > 200) {
    globeContainer.style.opacity = '1'; // Maak de globe zichtbaar
  } else {
    globeContainer.style.opacity = '0'; // Maak de globe onzichtbaar
  }
});
