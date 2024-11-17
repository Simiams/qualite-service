document.addEventListener("DOMContentLoaded", function() {
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

        markers.forEach(marker => {
            const lines = marker.feature.properties.lines.split(', ').map(line => line.trim());
            const hasTram = lines.some(line => tramLines.includes(line));
            const hasBus = lines.some(line => !tramLines.includes(line)); // Considère toutes les autres lignes comme bus

            if ((showBus && hasBus) || (showTram && hasTram)) {
                marker.addTo(map); // Affiche le marqueur s'il correspond au filtre
            } else {
                map.removeLayer(marker); // Supprime le marqueur de la carte s'il ne correspond pas
            }
        });
    }

    async function loadShapes() {
        console.log("heree")
        const polylines = L.layerGroup();
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
            const color = routeColors.get(routeId) || '#3388ff';
            const polyline = L.polyline(points, { color: color, weight: 4 });
            polylines.addLayer(polyline);
        });
        document.getElementById('toggleLines').addEventListener('click', () => {
            if (map.hasLayer(polylines)) {
                map.removeLayer(polylines);
            } else {
                map.addLayer(polylines);
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

                // Informations sur l'accès handicapé
                const wheelchairAccess = feature.properties.wheelchair_boarding === "1" ? "Oui" : "Non";
                
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
                    <b>Arrêt :</b> ${stopName}<br>
                    <b>Accès handicapé :</b> ${wheelchairAccess}<br>
                    <b>Correspondances :</b> ${lines.join(', ')}<br>
                    <b>Correspondance Tram :</b> ${tramLink}
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
        })
        .catch(error => console.error("Erreur de chargement des données :", error));
    });
