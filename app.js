// Referencias al DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const chartContainer = document.getElementById('chartContainer');
const canvas = document.getElementById('weatherChart');

let myChart = null;

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Función Principal
async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    showLoadingState();

    try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Ciudad no encontrada. Intenta con otro nombre.");
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&timezone=auto`);
        const weatherData = await weatherResponse.json();

        const timeArray = weatherData.hourly.time;
        const tempArray = weatherData.hourly.temperature_2m;

        const labels = timeArray.map(isoString => {
            const date = new Date(isoString);
            return `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:00`;
        });

        renderChart(labels, tempArray, `${name}, ${country}`);
        showSuccessState();

    } catch (error) {
        showErrorState(error.message);
    }
}

// Función para crear la gráfica (CORREGIDA)
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
                pointBackgroundColor: '#ffffff', 
                pointBorderColor: (ctx) => {
                    const val = ctx.raw; 
                    if (val >= 30) return '#ff4d4d'; 
                    if (val <= 10) return '#2e86de'; 
                    return '#4b5563'; 
                },
                pointRadius: 4,
                pointBorderWidth: 2,
                segment: {
                    borderColor: ctx => {
                        const val = ctx.p0.parsed.y;
                        if (val >= 30) return '#ff4d4d';
                        if (val <= 10) return '#2e86de';
                        return '#4b5563';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true }
            },
            scales: {
                y: { title: { display: true, text: 'Temperatura (°C)' } },
                x: { title: { display: true, text: 'Línea de Tiempo' }, ticks: { maxTicksLimit: 10 } }
            }
        }
    });
}

// Helpers de Estado
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
    errorMessage.textContent = msg || "Error al obtener datos.";
}
