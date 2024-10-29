import 'leaflet/dist/leaflet.css';
import React from 'react';
import Map from './Map'

const HomePage = () => {
    return (
        <div style={{height: "100vh", width: "100vw", position: "relative"}}>
            <Map/>
        </div>
    );
};

export default HomePage;