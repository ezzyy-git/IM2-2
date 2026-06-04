
// MAPBOX SETUP//

mapboxgl.accessToken = 'pk.eyJ1IjoibnVyaWFicnVlbGlzYXVlciIsImEiOiJjbW92aTVkZG8wNXR2MnBzZ3JxcjVuM3gwIn0.37g-sqCMaNhMG99LwuLefw';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [10, 20],
    zoom: 2
});

// API //

const API_URL = "https://extinct-api.herokuapp.com/api/v1/animal/50";

let animals = [];
let geocodedAnimals = [];

async function loadAnimals() {
    const response = await fetch(API_URL);
    const jsonResponse = await response.json();
    animals = jsonResponse.data;
    console.log("Loaded animals:", animals);

    await geocodeAllAnimals();
    placeMarkers();
    fillList();
}

loadAnimals();

// GEOCODING NAME TO COORDINATES //

async function geocodeLocation(locationString) {
    const geocodeURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationString)}.json?access_token=${mapboxgl.accessToken}`;

    const res = await fetch(geocodeURL);
    const data = await res.json();

    if (data.features.length === 0) return null;

    return data.features[0].center;
}

async function geocodeAllAnimals() {
    for (let animal of animals) {
        const coords = await geocodeLocation(animal.location);
        if (!coords) continue;

        geocodedAnimals.push({
            ...animal,
            coordinates: coords
        });
    }

    console.log("Geocoded animals:", geocodedAnimals);
}

// MAP MARKERS //

function placeMarkers() {
    geocodedAnimals.forEach(animal => {
        const el = document.createElement('div');
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '50%';
        el.style.background = '#6200FF';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 0 0 1px #6200FF';

        el.addEventListener('mouseenter', () => {
            el.style.background = '#EEFF00';
            el.style.boxShadow = '0 0 0 3px #EEFF00';
        });
        el.addEventListener('mouseleave', () => {
            el.style.background = '#6200FF';
            el.style.boxShadow = '0 0 0 3px #6200FF';
        });

        new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(animal.coordinates)
            .addTo(map);

        el.addEventListener("click", () => {
            openInfoPanel(animal);
        });
    });
}

// INFO PANEL //

// INFO PANEL //

const infoPanel = document.getElementById("infoPanel");

function openInfoPanel(animal) {
    infoPanel.classList.remove("hidden");

    document.getElementById("animalBioName").textContent = animal.binomialName;
    document.getElementById("animalCommon").textContent = (animal.commonName && animal.commonName !== "false") ? animal.commonName : "—";
    document.getElementById("animalLocation").textContent = animal.location;
    document.getElementById("animalYear").textContent = animal.lastRecord;

    const rawSrc = animal.imageSrc || "";
    const imgSrc = rawSrc.replace(/\/\d+px-/, '/250px-');
    const imgEl = document.getElementById("animalImage");

    if (imgSrc && imgSrc !== "false") {
        imgEl.src = imgSrc;
        imgEl.style.display = "block";
        imgEl.onerror = () => { imgEl.style.display = "none"; };
    } else {
        imgEl.src = "";
        imgEl.style.display = "none";
    }
}

// EXTINCT INDEX LIST //

const listSection = document.getElementById("listSection");
const listContainer = document.getElementById("listContainer");

function fillList() {
    listContainer.innerHTML = "";

    const sorted = [...animals].sort((a, b) =>
        (a.binomialName || "").localeCompare(b.binomialName || "")
    );

    sorted.forEach(a => {
        const li = document.createElement("li");
        const commonName = a.commonName || "false";
        const location = a.location || "—";
        const year = a.lastRecord || "—";
        li.textContent = `${a.binomialName} | ${commonName} | ${location} | ${year}`;
        li.addEventListener("click", () => openInfoPanel(a));
        listContainer.appendChild(li);
    });
}

// NAVIGATION BUTTONS //

const searchInput = document.getElementById("searchInput");

document.getElementById("searchBtn").addEventListener("click", () => {
    searchInput.classList.toggle("hidden");
    if (!searchInput.classList.contains("hidden")) {
        searchInput.focus();
        searchInput.value = "";
    }
});

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) return;
        const match = geocodedAnimals.find(a =>
            a.binomialName?.toLowerCase().includes(query) ||
            a.commonName?.toLowerCase().includes(query) ||
            a.location?.toLowerCase().includes(query)
        );
        if (match) {
            searchInput.classList.add("hidden");
            openInfoPanel(match);
            map.flyTo({ center: match.coordinates, zoom: 5, duration: 1200 });
        }
    }
    if (e.key === "Escape") {
        searchInput.classList.add("hidden");
    }
});

const shuffleOverlay = document.getElementById("shuffleOverlay");
const indexBtn = document.getElementById("indexBtn");
const mapBtn = document.getElementById("mapBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

function clearActiveButtons() {
    indexBtn.classList.remove("active");
    mapBtn.classList.remove("active");
}

shuffleBtn.addEventListener("click", () => {
    if (geocodedAnimals.length === 0) return;

    clearActiveButtons();

    // Show loading overlay
    infoPanel.classList.add("hidden");
    listSection.classList.add("hidden");
    searchInput.classList.add("hidden");
    shuffleOverlay.classList.remove("hidden");

    const random = geocodedAnimals[Math.floor(Math.random() * geocodedAnimals.length)];

    setTimeout(() => {
        shuffleOverlay.classList.add("hidden");
        openInfoPanel(random);
        map.flyTo({ center: random.coordinates, zoom: 5, duration: 1200 });
    }, 1500);
});

mapBtn.addEventListener("click", () => {
    clearActiveButtons();
    mapBtn.classList.add("active");
    infoPanel.classList.add("hidden");
    listSection.classList.add("hidden");
    searchInput.classList.add("hidden");
    shuffleOverlay.classList.add("hidden");
    map.flyTo({ center: [10, 20], zoom: 2, duration: 1200 });
});

indexBtn.addEventListener("click", () => {
    clearActiveButtons();
    indexBtn.classList.add("active");
    infoPanel.classList.add("hidden");
    searchInput.classList.add("hidden");
    shuffleOverlay.classList.add("hidden");
    fillList();
    listSection.classList.remove("hidden");
});