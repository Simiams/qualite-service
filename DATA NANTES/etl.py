import pandas as pd
import json

# Chemin vers les fichiers extraits du GTFS
path_to_gtfs_folder = "./gtfs-tan/"  # Remplacez par le chemin de votre dossier GTFS

# Charger les fichiers GTFS en utilisant pandas
stops_df = pd.read_csv(f"{path_to_gtfs_folder}/stops.txt")
routes_df = pd.read_csv(f"{path_to_gtfs_folder}/routes.txt")
trips_df = pd.read_csv(f"{path_to_gtfs_folder}/trips.txt")
stop_times_df = pd.read_csv(f"{path_to_gtfs_folder}/stop_times.txt", low_memory=False)

# Associer les trips aux routes pour obtenir les lignes pour chaque trip
trips_routes = trips_df[['trip_id', 'route_id']].merge(routes_df[['route_id', 'route_short_name']], on='route_id')

# Associer les arrêts aux trips et aux lignes
stops_with_routes = stop_times_df[['stop_id', 'trip_id']].merge(trips_routes, on='trip_id').drop_duplicates()

# Ajouter les informations des arrêts
stops_with_routes = stops_with_routes.merge(stops_df[['stop_id', 'stop_name', 'stop_lat', 'stop_lon']], on='stop_id')

# Convertir les valeurs en chaîne de caractères et gérer les valeurs manquantes
stops_with_routes['route_short_name'] = stops_with_routes['route_short_name'].fillna('').astype(str)

# Regrouper les lignes pour chaque arrêt
stops_with_routes['lines'] = stops_with_routes.groupby('stop_id')['route_short_name'].transform(lambda x: ', '.join(x.unique()))
stops_geojson_df = stops_with_routes[['stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'lines']].drop_duplicates()

# Créer la structure GeoJSON
features = []
for _, row in stops_geojson_df.iterrows():
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [row['stop_lon'], row['stop_lat']]
        },
        "properties": {
            "stop_id": row['stop_id'],
            "stop_name": row['stop_name'],
            "lines": row['lines']
        }
    }
    features.append(feature)

geojson_data = {
    "type": "FeatureCollection",
    "features": features
}

# Sauvegarder en GeoJSON
with open("stops_with_lines.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson_data, f, ensure_ascii=False, indent=4)

print("Fichier GeoJSON avec arrêts et lignes sauvegardé sous 'stops_with_lines.geojson'")