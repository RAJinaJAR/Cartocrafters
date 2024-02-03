import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { START_POINT, END_POINT } from "./constants";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import { Icon } from "leaflet";

const MapWithDirections = () => {
  const [map, setMap] = useState(null);

  const handleMapInit = (map) => {
    setMap(map);
  };

  const handleRouting = () => {
    if (map) {
      L.Routing.control({
        waypoints: [
          L.latLng(START_POINT.lat, START_POINT.lng),
          L.latLng(END_POINT.lat, END_POINT.lng),
        ],
        routeWhileDragging: true,
      }).addTo(map);
    }
  };

  const mapInstance = useMap(); // use useMap hook to get access to the map instance

  return (
    <div>
      <MapContainer
        center={[START_POINT.lat, START_POINT.lng]}
        zoom={13}
        style={{ height: "80vh", width: "100%" }}
        whenCreated={handleMapInit}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        <Marker
          position={[START_POINT.lat, START_POINT.lng]}
          icon={
            new Icon({
              iconUrl: markerIconPng,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
          }
          draggable={true} // Make the marker draggable
        >
          <Popup>Start Point</Popup>
        </Marker>

        <Marker
          position={[END_POINT.lat, END_POINT.lng]}
          icon={
            new Icon({
              iconUrl: markerIconPng,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
          }
          draggable={true} // Make the marker draggable
        >
          <Popup>End Point</Popup>
        </Marker>
      </MapContainer>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button onClick={handleRouting}>Get Directions</button>
      </div>
    </div>
  );
};

export default MapWithDirections;
