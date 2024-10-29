import React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Marker} from "react-leaflet";


interface CustomMarkerProps {
    position: L.LatLngExpression;
    children: React.ReactNode;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({position, children}) => {
    return (
        <Marker position={position}>
            {children}
        </Marker>
    );
};

export default CustomMarker;