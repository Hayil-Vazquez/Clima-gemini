// Referencias al DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const chartContainer = document.getElementById('chartContainer');
const canvas = document.getElementById('weatherChart');

// Variable global para almacenar la instancia del gráfico (para destruirla luego)
let myChart = null;

// Event Listener
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Función Principal
async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    // 1. Gestionar estados iniciales (Mostrar loading, ocultar otros)
    showLoadingState();

    try {
        // 2. Geocodificación: Obtener Lat/Lon de la ciudad
        // Usamos la API de Geocoding de Open-Meteo
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Ciudad no encontrada. Intenta con otro nombre.");
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 3. Obtener Clima: Usamos coordenadas para pedir el pronóstico
        // Pedimos temperatura a 2m
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&timezone=auto`);
        const weatherData = await weatherResponse.json();

        // 4. Transformación de Datos
        // Open-Meteo devuelve arrays gigantes (7 días x 24 horas). Filtraremos para visualizar.
        const timeArray = weatherData.hourly.time;
        const tempArray = weatherData.hourly.temperature_2m;

        // Formatear fechas para el eje X (Día/Hora)
        const labels = timeArray.map(isoString => {
            const date = new Date(isoString);
            return `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:00`;
        });

        // 5. Renderizar Gráfica
        renderChart(labels, tempArray, `${name}, ${country}`);
        
        showSuccessState();

    } catch (error) {
        showErrorState(error.message);
    }
}

// Función para crear la gráfica con Chart.js
function renderChart(labels, data, locationName) {
    const ctx = canvas.getContext('2d');

    // Control de Memoria: Destruir gráfica anterior si existe
    if (myChart) {
        myChart.destroy();
    }


   function renderChart(labels, data, locationName) {
    const ctx = canvas.getContext('2d');

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperatura en ${locationName} (°C)`,
                data: data,
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                
                // --- Estilo de Puntos Mejorado ---
                pointBackgroundColor: '#ffffff', 
                pointBorderColor: (ctx) => {
                    const val = ctx.raw; 
                    if (val >= 30) return '#ff4d4d'; // Rojo
                    if (val <= 10) return '#2e86de'; // Azul
                    return '#4b5563'; // Gris
                },
                pointRadius: 4,
                pointBorderWidth: 2,
                
                // --- Estilo de Línea Dinámico ---
                segment: {
                    borderColor: ctx => {
                        const val = ctx.p0.parsed.y;
                        if (val >= 30) return '#ff4d4d';
                        if (val <= 10) return '#2e86de';
                        return '#4b5563';
                    }
                }
            }]
        }, // <--- Aquí cerramos 'data'
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Temperatura (°C)' }
                },
                x: {
                    title: { display: true, text: 'Línea de Tiempo (Días / Horas)' },
                    ticks: { maxTicksLimit: 10 }
                }
            }
        }
    });
}

// Helpers de Estado (Visuales)
function showLoadingState() {
    loadingContainer.classList.remove('hidden');
    chartContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
}

function showSuccessState() {
    loadingContainer.classList.add('hidden');
    chartContainer.classList.remove('hidden');
    errorContainer.classList.add('hidden');
}

function showErrorState(msg) {
    loadingContainer.classList.add('hidden');
    chartContainer.classList.add('hidden');
    errorContainer.classList.remove('hidden');
    errorMessage.textContent = msg || "Ocurrió un error al obtener los datos.";
}
