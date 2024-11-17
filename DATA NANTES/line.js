document.addEventListener("DOMContentLoaded", function() {
    async function loadShapes() {
        console.log("heree")
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
    }
    loadShapes();
});
