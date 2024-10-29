import {MapContainer, Popup, TileLayer} from "react-leaflet";
import React from "react";
import 'leaflet/dist/leaflet.css';
import CustomMarker from "../components/CustomMarker";


const Map = () => {
    return (
        <div style={{height: "100vh", width: "100vw", position: "relative"}}>
            <MapContainer center={[48.8566, 2.3522]} zoom={13} style={{height: "100%", width: "100%"}}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <CustomMarker position={[48.8566, 2.3522]}>
                    <Popup>Bienvenue à Paris !</Popup>
                </CustomMarker>
            </MapContainer>
        </div>
    );
}

export default Map;