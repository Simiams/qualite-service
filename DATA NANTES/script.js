document.addEventListener("DOMContentLoaded", function() {
    stopsInformation = []

    fetch('arrets.geojson')
        .then(response => response.json())
        .then(data => {
            data.features.forEach(d => {
                stopsInformation.push({
                    "stop_id": d.properties.stop_id,
                    "wheelchair_boarding": d.properties.wheelchair_boarding
                })
            })
        })

    // Initialiser la carte et la centrer sur Nantes
    const map = L.map('map').setView([47.218371, -1.553621], 13);

    // Ajouter un fond de carte OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Définir les lignes de tram explicitement
    const tramLines = ["1", "2", "3", "4"];

    // Générateur de couleurs pour les lignes individuelles
    const lineColors = {};
    const markers = [];  // Liste pour stocker les marqueurs ajoutés
    const imagesDownloaded = ["BOFA1", "COMC1", "DCAN1", "IDNA2", "STPI1"]

    function generateRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Fonction pour filtrer les arrêts affichés en fonction du type
    function filterMarkers() {
        const showBus = document.getElementById('filterBus').checked;
        const showTram = document.getElementById('filterTram').checked;
        const showDisability = document.getElementById('filterDisability').checked;

        markers.forEach(marker => {
            const lines = marker.feature.properties.lines.split(', ').map(line => line.trim());
            const hasTram = lines.some(line => tramLines.includes(line));
            const hasBus = lines.some(line => !tramLines.includes(line)); // Considère toutes les autres lignes comme bus

            if ((showBus && hasBus) || (showTram && hasTram)) {
                const isDisabilityFriendly =  stopsInformation.find(stop => stop.stop_id === marker.feature.properties.stop_id)?.wheelchair_boarding === "1"
                marker.addTo(map);
                if (showDisability && !isDisabilityFriendly) {
                    map.removeLayer(marker);
                }
            } else {
                map.removeLayer(marker);
            }
        });
    }

    // Icône pour un bus
    const busIcon = L.divIcon({
        html: '<div class="bus-icon"><i class="fa-solid fa-bus"></i></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });

    const tramIcon = L.divIcon({
        html: '<div class="bus-icon"><i class="fa-solid fa-tram"></i></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });

    async function loadShapes() {
        const polylinesBus = L.layerGroup();
        const polyLinesTram = L.layerGroup();

        const shapesResponse = await fetch('gtfs-tan/shapes.txt');
        const tripsResponse = await fetch('gtfs-tan/trips.txt');
        const routesResponse = await fetch('gtfs-tan/routes.txt');

        const shapesData = await shapesResponse.text();
        const tripsData = await tripsResponse.text();
        const routesData = await routesResponse.text();

        const shapesLines = shapesData.split('\n');
        const tripsLines = tripsData.split('\n');
        const routesLines = routesData.split('\n');

        const shapeMap = new Map();
        const tripToRoute = new Map();
        const routeColors = new Map();

        // Lire trips.txt pour associer trip_id à route_id et shape_id
        for (let i = 1; i < tripsLines.length; i++) {
            const line = tripsLines[i].split(',');
            //if (line.length < 7) continue;
            const tripId = line[2];
            const routeId = line[0];
            const shapeId = line[6];
            tripToRoute.set(shapeId, routeId);
        }

        // Lire routes.txt pour associer route_id à une couleur
        for (let i = 1; i < routesLines.length; i++) {
            const line = routesLines[i].split(',');
            //if (line.length < 5) continue;
            const routeId = line[0];
            const routeColor = line[5] || '#3388ff';
            routeColors.set(routeId, `#${routeColor}`);
        }

        // Lire shapes.txt et stocker les coordonnées par shape_id
        for (let i = 1; i < shapesLines.length; i++) {
            const line = shapesLines[i].split(',');
            if (line.length < 4) continue;
            const shapeId = line[0];
            const lat = parseFloat(line[1]);
            const lon = parseFloat(line[2]);

            if (!shapeMap.has(shapeId)) {
                shapeMap.set(shapeId, []);
            }
            shapeMap.get(shapeId).push([lat, lon]);
        }

        // Tracer les lignes sur la carte
        shapeMap.forEach((points, shapeId) => {
            const routeId = tripToRoute.get(shapeId);
            if (routeId == '1-0' || routeId == '1B-0' || routeId == '2-0' || routeId == '2B-0' || routeId == '3-0' || routeId == '3B-0' || routeId == '4-0') {
                const color = routeColors.get(routeId) || '#3388ff';
                const polyline = L.polyline(points, { color: color, weight: 4 });
                polyLinesTram.addLayer(polyline);
            } else {
                const color = routeColors.get(routeId) || '#3388ff';
                const polyline = L.polyline(points, { color: color, weight: 4 });
                polylinesBus.addLayer(polyline);
            }
        });
        document.getElementById('filterTramLine').addEventListener('change', () => {
            if (map.hasLayer(polyLinesTram)) {
                map.removeLayer(polyLinesTram);
            } else {
                map.addLayer(polyLinesTram);
            }
        });

        document.getElementById('filterBusLine').addEventListener('change', () => {
            if (map.hasLayer(polylinesBus)) {
                map.removeLayer(polylinesBus);
            } else {
                map.addLayer(polylinesBus);
            }
        });
    }
    loadShapes();

    // Charger le fichier GeoJSON et ajouter les arrêts à la carte
    fetch('stops_with_lines.geojson') // Remplacez par le chemin de votre fichier GeoJSON
        .then(response => response.json())
        .then(data => {
            data.features.forEach(feature => {
                const latlng = feature.geometry.coordinates.reverse();
                const lines = feature.properties.lines.split(', ').map(line => line.trim());
                const stopName = feature.properties.stop_name || "Nom non disponible";
                const stopId = feature.properties.stop_id || null;
                const images =  imagesDownloaded.includes(stopId) ? `./stops-images/${stopId}.jpg` : null


                // Informations sur l'accès handicapé
                const wheelchairAccess =  stopsInformation.find(stop => stop.stop_id === feature.properties.stop_id)?.wheelchair_boarding === "1" ? "Oui" : "Non";

                // Indication de correspondance avec le tram
                const tramLink = lines.some(line => tramLines.includes(line)) ? "Oui" : "Non";

                // Assigner une couleur unique pour chaque ligne si elle n'existe pas encore
                lines.forEach(line => {
                    if (!lineColors[line]) {
                        lineColors[line] = generateRandomColor();
                    }
                });

                // Créer le cercle pour l'arrêt avec la couleur spécifique de la ligne
                const color = lineColors[lines[0]]; // Utiliser la couleur unique de la première ligne
                const marker = L.circleMarker(latlng, {
                    radius: 5,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.8
                });

                // Enregistrer les métadonnées et ajout à la liste des marqueurs
                marker.feature = feature;
                markers.push(marker);

                // Contenu du popup avec les métadonnées
                const metadataContent = `
                    <div class="metadata">
                        ${images ? `<img src="${images}" class="stop-image"/>` : ''}
                        <span><b>Arrêt :</b> ${stopName}</span>
                        <span><b>Accès handicapé :</b> ${wheelchairAccess}</span>
                        <span><b>Correspondances :</b> ${lines.join(', ')}</span>
                        <span><b>Correspondance Tram :</b> ${tramLink}</span>
                        <span><b>ID :</b> ${stopId}</span>
                    </div>
                `;

                // Afficher les métadonnées au passage de la souris
                marker.on('mouseover', function() {
                    marker.bindPopup(metadataContent).openPopup();
                });

                // Afficher les métadonnées au clic droit
                marker.on('contextmenu', function(e) {
                    L.popup()
                        .setLatLng(e.latlng)
                        .setContent(metadataContent)
                        .openOn(map);
                });

                // Ajouter le marqueur à la carte
                marker.addTo(map);
            });

            // Appliquer le filtre initial
            filterMarkers();

            // Ajouter des écouteurs pour les cases à cocher de filtrage
            document.getElementById('filterBus').addEventListener('change', filterMarkers);
            document.getElementById('filterTram').addEventListener('change', filterMarkers);
            document.getElementById('filterDisability').addEventListener('change', filterMarkers);
        })

        .catch(error => console.error("Erreur de chargement des données :", error));
    });
