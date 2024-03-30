const APIkey = "fsq3aybQJIUjJu3isb3C8RJEwDYH3hi7qBFyQb/YfIlgzHY=";

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: APIkey
    }
};

// Initialize Leaflet map
const map = L.map('map');

// Add Tile layer from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to add markers for businesses
function addBusinessMarkers(data) {
    data.results.forEach(result => {
        const { latitude, longitude, short_name } = result.geocodes.main;
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`<b>${short_name}</b>`).openPopup();
    });
}

// Function to add marker for user's location
function addUserMarker(latitude, longitude) {
    const userMarker = L.marker([latitude, longitude]).addTo(map);
    userMarker.bindPopup('Your location').openPopup();
}

// Function to filter markers based on category selection
function filterMarkers(data, category) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    data.results.forEach(result => {
        if (category === 'All' || result.categories.some(cat => cat.name === category)) {
            const { latitude, longitude, short_name } = result.geocodes.main;
            const marker = L.marker([latitude, longitude]).addTo(map);
            marker.bindPopup(`<b>${short_name}</b>`).openPopup();
        }
    });
}

// Get current user location
navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;

    // Set map view to the user's location
    map.setView([latitude, longitude], 12);

    // Add marker for the user's location
    addUserMarker(latitude, longitude);

    // Fetch data from Foursquare API
    fetch('https://api.foursquare.com/v3/places/nearby', options)
        .then(response => response.json())
        .then(data => {
            addBusinessMarkers(data);
            populateCategories(data);
        })
        .catch(error => console.error(error));
}, error => {
    console.error(error);
    // If geolocation fails, set default map view
    map.setView([45.83, -119.7], 12);

    // Fetch data from Foursquare API
    fetch('https://api.foursquare.com/v3/places/nearby', options)
        .then(response => response.json())
        .then(data => {
            addBusinessMarkers(data);
            populateCategories(data);
        })
        .catch(error => console.error(error));
});

// Function to populate categories in the select control
function populateCategories(data) {
    const categoryNames = data.results.flatMap(result => result.categories.map(category => category.name));
    const selectControl = document.getElementById('FilterCategories');
    const uniqueCategoryNames = ['All', ...new Set(categoryNames)]; // Include "All" as default option
    selectControl.innerHTML = ''; // Clear existing options
    uniqueCategoryNames.forEach(categoryName => {
        const option = document.createElement('option');
        option.text = categoryName;
        selectControl.add(option);
    });
}

// Event listener for select control
document.getElementById('FilterCategories').addEventListener('change', event => {
    const selectedCategory = event.target.value;
    fetch('https://api.foursquare.com/v3/places/nearby', options)
        .then(response => response.json())
        .then(data => {
            filterMarkers(data, selectedCategory);
        })
        .catch(error => console.error(error));
});
