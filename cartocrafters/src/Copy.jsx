import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

const MapComponent = () => {
  const [start, setStart] = useState({ address: '', lat: null, lng: null });
  const [end, setEnd] = useState({ address: '', lat: null, lng: null });
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (!map) {
      // Initialize Leaflet map
      const newMap = L.map('map').setView([51.505, -0.09], 13);
      
      // Set map object to state
      setMap(newMap);

      // Add base tile layer from OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);

      // Add marker
      const newMarker = L.marker([51.5, -0.09], { draggable: true }).addTo(newMap);
      setMarker(newMarker);
    }
  }, [map]);

  useEffect(() => {
    if (marker) {
      marker.on('dragend', function (e) {
        const latlng = e.target.getLatLng();
        setStart({ ...start, lat: latlng.lat, lng: latlng.lng });
      });
    }
  }, [marker, start]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!map || !start.address || !end.address) return;

    try {
      const startCoords = await getCoordinates(start.address);
      const endCoords = await getCoordinates(end.address);

      if (startCoords && endCoords) {
        setStart({ ...start, lat: startCoords.lat, lng: startCoords.lng });
        setEnd({ ...end, lat: endCoords.lat, lng: endCoords.lng });

        const control = L.Routing.control({
          waypoints: [
            L.latLng(startCoords.lat, startCoords.lng),
            L.latLng(endCoords.lat, endCoords.lng)
          ],
          routeWhileDragging: true
        }).addTo(map);

        control.route();
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
  };

  const getCoordinates = async (address) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
    const data = await response.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  };

  const handleStartChange = (e) => {
    setStart({ ...start, address: e.target.value });
  };

  const handleEndChange = (e) => {
    setEnd({ ...end, address: e.target.value });
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <div>
          <label>Start Point:</label>
          <input type="text" name="start" placeholder="Enter start address" value={start.address} onChange={handleStartChange} />
        </div>
        <div>
          <label>End Point:</label>
          <input type="text" name="end" placeholder="Enter end address" value={end.address} onChange={handleEndChange} />
        </div>
        <button type="submit">Search</button>
      </form>
      <div id="map" style={{ height: '400px', width: '100%' }} />
    </div>
  );
};

export default MapComponent;
