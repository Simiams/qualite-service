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
