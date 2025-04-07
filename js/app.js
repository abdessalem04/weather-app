// Configuration de l'API
const API_KEY = ''; // Nouvelle clé API fournie par l'utilisateur
const BASE_URL = 'https://api.weatherapi.com/v1';

// Configuration de la carte météo et du graphique
let map = null;
let weatherLayer = null;
let tempChart = null;

// Éléments DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const forecastContainer = document.getElementById('forecast-container');
const unitToggle = document.getElementById('unit-toggle');
const alertsContainer = document.getElementById('alerts-container');

// Variables globales
let tempUnit = 'C'; // 'C' pour Celsius, 'F' pour Fahrenheit

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger la dernière ville recherchée ou Paris par défaut
    const lastCity = localStorage.getItem('lastCity');
    const welcomeMessage = document.getElementById('welcome-message');
    
    // Récupérer l'unité de température préférée
    const savedUnit = localStorage.getItem('tempUnit');
    if (savedUnit) {
        tempUnit = savedUnit;
        updateUnitToggleDisplay();
    }
    
    // Afficher le message de bienvenue si c'est la première visite
    if (!lastCity) {
        welcomeMessage.style.display = 'block';
        setTimeout(() => {
            welcomeMessage.style.display = 'none';
        }, 5000); // Masquer après 5 secondes
    }
    
    // Vérifier si la géolocalisation est disponible
    if (navigator.geolocation && !lastCity) {
        // Si c'est la première visite, proposer la géolocalisation automatiquement
        getLocationWeather();
    } else {
        getWeather(lastCity || 'Paris');
    }
    
    // Ajouter les événements
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
        }
    });
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                getWeather(city);
            }
        }
    });
    
    // Événement pour le bouton de géolocalisation
    if (geoBtn) {
        geoBtn.addEventListener('click', getLocationWeather);
    }
    
    // Événement pour le changement d'unité
    if (unitToggle) {
        unitToggle.addEventListener('click', toggleTemperatureUnit);
    }
});

// Fonction pour obtenir la météo basée sur la géolocalisation
function getLocationWeather() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeather(`${lat},${lon}`);
            },
            (error) => {
                console.error("Erreur de géolocalisation:", error);
                showError("Impossible d'obtenir votre position. Veuillez entrer une ville manuellement.");
                getWeather('Paris'); // Fallback à Paris
            }
        );
    } else {
        showError("La géolocalisation n'est pas supportée par votre navigateur.");
        getWeather('Paris'); // Fallback à Paris
    }
}

// Fonction pour changer l'unité de température
function toggleTemperatureUnit() {
    tempUnit = tempUnit === 'C' ? 'F' : 'C';
    localStorage.setItem('tempUnit', tempUnit);
    updateUnitToggleDisplay();
    
    // Mettre à jour l'affichage avec la nouvelle unité
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        getWeather(lastCity);
    }
}

// Mettre à jour l'affichage du bouton de changement d'unité
function updateUnitToggleDisplay() {
    if (unitToggle) {
        unitToggle.textContent = tempUnit === 'C' ? '°C → °F' : '°F → °C';
    }
}

// Fonction pour récupérer les données météo
async function getWeather(city) {
    try {
        showLoading();
        
        // Récupérer les données météo actuelles et les prévisions
        const response = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=10&lang=fr&alerts=yes`);
        
        if (!response.ok) {
            throw new Error('Ville non trouvée ou problème avec l\'API');
        }
        
        const data = await response.json();
        
        // Mettre à jour l'interface avec les données
        updateCurrentWeather(data.location, data.current);
        updateForecast(data.forecast.forecastday);
        
        // Afficher les alertes météo si disponibles
        if (data.alerts && data.alerts.alert.length > 0) {
            updateAlerts(data.alerts.alert);
        } else if (alertsContainer) {
            alertsContainer.innerHTML = '';
            alertsContainer.style.display = 'none';
        }
        
        // Initialiser ou mettre à jour la carte météo
        if (data.location.lat && data.location.lon) {
            initWeatherMap(data.location.lat, data.location.lon);
        }
        
        // Sauvegarder la dernière ville recherchée
        localStorage.setItem('lastCity', city);
    } catch (error) {
        showError(error.message);
    }
}

// Fonction pour mettre à jour la météo actuelle
function updateCurrentWeather(location, current) {
    // Mettre à jour le nom de la ville
    cityName.textContent = `${location.name}, ${location.country}`;
    
    // Mettre à jour la date
    const date = new Date();
    currentDate.textContent = formatDate(date);
    
    // Mettre à jour la température selon l'unité choisie
    if (tempUnit === 'C') {
        currentTemp.textContent = Math.round(current.temp_c);
        document.querySelector('.degree').textContent = '°C';
    } else {
        currentTemp.textContent = Math.round(current.temp_f);
        document.querySelector('.degree').textContent = '°F';
    }
    
    // Mettre à jour l'icône et la description
    updateWeatherIcon(weatherIcon, current.condition.code);
    weatherDescription.textContent = current.condition.text;
    
    // Mettre à jour les détails
    windSpeed.textContent = tempUnit === 'C' ? `${current.wind_kph} km/h` : `${current.wind_mph} mph`;
    humidity.textContent = `${current.humidity}%`;
}

// Fonction pour mettre à jour les prévisions
function updateForecast(forecastData) {
    forecastContainer.innerHTML = '';
    
    // Créer un conteneur pour le graphique de température
    const chartContainer = document.createElement('div');
    chartContainer.classList.add('chart-container');
    chartContainer.innerHTML = '<canvas id="temp-chart"></canvas>';
    forecastContainer.appendChild(chartContainer);
    
    // Créer le graphique de température
    createTemperatureChart(forecastData);
    
    // Créer un conteneur pour les cartes de prévision
    const cardsContainer = document.createElement('div');
    cardsContainer.classList.add('forecast-cards');
    forecastContainer.appendChild(cardsContainer);
    
    forecastData.forEach((day, index) => {
        // Créer la carte de prévision
        const forecastCard = document.createElement('div');
        forecastCard.classList.add('forecast-card');
        
        // Date
        const date = new Date(day.date);
        const dateElement = document.createElement('div');
        dateElement.classList.add('forecast-date');
        dateElement.textContent = index === 0 ? "Aujourd'hui" : formatDay(date);
        
        // Icône
        const iconElement = document.createElement('div');
        iconElement.classList.add('forecast-icon');
        const icon = document.createElement('i');
        updateWeatherIcon(icon, day.day.condition.code);
        iconElement.appendChild(icon);
        
        // Température selon l'unité choisie
        const tempElement = document.createElement('div');
        tempElement.classList.add('forecast-temp');
        
        if (tempUnit === 'C') {
            tempElement.innerHTML = `${Math.round(day.day.maxtemp_c)}<span class="degree">°C</span> / ${Math.round(day.day.mintemp_c)}<span class="degree">°C</span>`;
        } else {
            tempElement.innerHTML = `${Math.round(day.day.maxtemp_f)}<span class="degree">°F</span> / ${Math.round(day.day.mintemp_f)}<span class="degree">°F</span>`;
        }
        
        // Détails
        const detailsElement = document.createElement('div');
        detailsElement.classList.add('forecast-details');
        
        const windSpeed = tempUnit === 'C' ? `${day.day.maxwind_kph} km/h` : `${day.day.maxwind_mph} mph`;
        
        detailsElement.innerHTML = `
            <p class="condition-text">${day.day.condition.text}</p>
            <div class="detail-row">
                <p><i class="fas fa-tint"></i> Humidité: ${day.day.avghumidity}%</p>
                <p><i class="fas fa-wind"></i> Vent: ${windSpeed}</p>
            </div>
            <div class="detail-row">
                <p><i class="fas fa-sun"></i> UV: ${day.day.uv}</p>
                <p><i class="fas fa-cloud-rain"></i> Pluie: ${day.day.daily_chance_of_rain}%</p>
            </div>
        `;
        
        // Ajouter les éléments à la carte
        forecastCard.appendChild(dateElement);
        forecastCard.appendChild(iconElement);
        forecastCard.appendChild(tempElement);
        forecastCard.appendChild(detailsElement);
        
        // Ajouter la carte au conteneur
        cardsContainer.appendChild(forecastCard);
    });
}

// Fonction pour créer un graphique de température
function createTemperatureChart(forecastData) {
    const chartCanvas = document.getElementById('temp-chart');
    if (!chartCanvas) return;
    
    // Préparer les données pour le graphique
    const labels = forecastData.map((day, index) => {
        const date = new Date(day.date);
        return index === 0 ? "Aujourd'hui" : formatDay(date);
    });
    
    const maxTemps = forecastData.map(day => tempUnit === 'C' ? day.day.maxtemp_c : day.day.maxtemp_f);
    const minTemps = forecastData.map(day => tempUnit === 'C' ? day.day.mintemp_c : day.day.mintemp_f);
    
    // Détruire le graphique existant s'il y en a un
    if (tempChart) {
        tempChart.destroy();
    }
    
    // Créer le nouveau graphique
    tempChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Température max',
                    data: maxTemps,
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Température min',
                    data: minTemps,
                    borderColor: '#3b5998',
                    backgroundColor: 'rgba(59, 89, 152, 0.2)',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution des températures sur 10 jours',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + (tempUnit === 'C' ? '°C' : '°F');
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Température (' + (tempUnit === 'C' ? '°C' : '°F') + ')'
                    }
                }
            }
        }
    });
}

// Fonction pour mettre à jour l'icône météo en fonction du code
function updateWeatherIcon(iconElement, conditionCode) {
    // Mapping des codes de condition aux classes Font Awesome
    const iconMap = {
        // Ensoleillé / Clair
        1000: 'fa-sun',
        
        // Partiellement nuageux
        1003: 'fa-cloud-sun',
        
        // Nuageux / Couvert
        1006: 'fa-cloud',
        1009: 'fa-cloud',
        
        // Brouillard
        1030: 'fa-smog',
        1135: 'fa-smog',
        1147: 'fa-smog',
        
        // Pluie
        1063: 'fa-cloud-rain',
        1180: 'fa-cloud-rain',
        1183: 'fa-cloud-rain',
        1186: 'fa-cloud-rain',
        1189: 'fa-cloud-rain',
        1192: 'fa-cloud-showers-heavy',
        1195: 'fa-cloud-showers-heavy',
        1240: 'fa-cloud-rain',
        1243: 'fa-cloud-showers-heavy',
        1246: 'fa-cloud-showers-heavy',
        
        // Neige
        1066: 'fa-snowflake',
        1114: 'fa-snowflake',
        1210: 'fa-snowflake',
        1213: 'fa-snowflake',
        1216: 'fa-snowflake',
        1219: 'fa-snowflake',
        1222: 'fa-snowflake',
        1225: 'fa-snowflake',
        1255: 'fa-snowflake',
        1258: 'fa-snowflake',
        
        // Pluie et neige mêlées
        1069: 'fa-cloud-meatball',
        1072: 'fa-cloud-meatball',
        1168: 'fa-cloud-meatball',
        1171: 'fa-cloud-meatball',
        1198: 'fa-cloud-meatball',
        1201: 'fa-cloud-meatball',
        1204: 'fa-cloud-meatball',
        1207: 'fa-cloud-meatball',
        1249: 'fa-cloud-meatball',
        1252: 'fa-cloud-meatball',
        
        // Orage
        1087: 'fa-bolt',
        1273: 'fa-bolt',
        1276: 'fa-bolt',
        1279: 'fa-bolt',
        1282: 'fa-bolt'
    };
    
    // Classe par défaut si le code n'est pas trouvé
    let iconClass = 'fa-cloud';
    
    // Si le code existe dans notre mapping, utiliser la classe correspondante
    if (iconMap[conditionCode]) {
        iconClass = iconMap[conditionCode];
    }
    
    // Supprimer toutes les classes fa-* existantes
    iconElement.className = '';
    
    // Ajouter les classes de base et la classe spécifique
    iconElement.classList.add('fas', iconClass);
}

// Fonction pour formater la date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Fonction pour formater le jour
function formatDay(date) {
    const options = { weekday: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Fonction pour afficher un message d'erreur
function showError(message) {
    forecastContainer.innerHTML = `<div class="error">${message}</div>`;
    cityName.textContent = 'Erreur';
    currentDate.textContent = '';
    currentTemp.textContent = '--';
    weatherDescription.textContent = 'Erreur de chargement';
    windSpeed.textContent = '-- km/h';
    humidity.textContent = '--%';
}

// Fonction pour afficher les alertes météo
function updateAlerts(alerts) {
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    alertsContainer.style.display = 'block';
    
    const alertTitle = document.createElement('h3');
    alertTitle.textContent = 'Alertes météo';
    alertTitle.classList.add('alert-title');
    alertsContainer.appendChild(alertTitle);
    
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.classList.add('alert-item');
        
        const alertHeader = document.createElement('div');
        alertHeader.classList.add('alert-header');
        alertHeader.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>${alert.event}</span>`;
        
        const alertContent = document.createElement('div');
        alertContent.classList.add('alert-content');
        alertContent.innerHTML = `
            <p><strong>Début:</strong> ${new Date(alert.effective).toLocaleString('fr-FR')}</p>
            <p><strong>Fin:</strong> ${new Date(alert.expires).toLocaleString('fr-FR')}</p>
            <p>${alert.desc}</p>
        `;
        
        alertElement.appendChild(alertHeader);
        alertElement.appendChild(alertContent);
        alertsContainer.appendChild(alertElement);
    });
}

// Fonction pour initialiser et mettre à jour la carte météo
function initWeatherMap(lat, lon) {
    const mapContainer = document.getElementById('weather-map');
    if (!mapContainer) return;
    
    // Si la carte n'existe pas encore, l'initialiser
    if (!map) {
        mapContainer.style.height = '400px';
        map = L.map('weather-map').setView([lat, lon], 8);
        
        // Ajouter la couche de carte OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    } else {
        // Sinon, mettre à jour la vue de la carte
        map.setView([lat, lon], 8);
    }
    
    // Ajouter un marqueur à la position actuelle
    if (weatherLayer) {
        map.removeLayer(weatherLayer);
    }
    
    weatherLayer = L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${cityName.textContent}</b><br>${weatherDescription.textContent}, ${currentTemp.textContent}${document.querySelector('.degree').textContent}`)
        .openPopup();
    
    // Ajouter une couche de précipitations (si disponible via une API compatible)
    addPrecipitationLayer();
}

// Fonction pour ajouter une couche de précipitations à la carte
function addPrecipitationLayer() {
    // Cette fonction pourrait être implémentée pour ajouter des données de précipitations
    // en utilisant une API compatible comme OpenWeatherMap ou RainViewer
    // Exemple avec RainViewer (nécessiterait une intégration supplémentaire)
    // https://www.rainviewer.com/api.html
}

// Fonction pour afficher le chargement
function showLoading() {
    forecastContainer.innerHTML = '<div class="loading">Chargement des prévisions...</div>';
}