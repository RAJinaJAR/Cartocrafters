import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import customMarkerIcon from "leaflet/dist/images/marker-icon-2x.png"; // Update the path to your custom marker icon
import { Icon } from "leaflet";

const MapComponent = () => {
  const [start, setStart] = useState({ address: "", lat: null, lng: null });
  const [end, setEnd] = useState({ address: "", lat: null, lng: null });
  const [map, setMap] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [routeControl, setRouteControl] = useState(null);

  const customIcon = new L.Icon({
    iconUrl: customMarkerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  useEffect(() => {
    if (!map) {
      // Initialize Leaflet map
      const newMap = L.map("map").setView([51.505, -0.09], 13);

      // Set map object to state
      setMap(newMap);

      // Add base tile layer from OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(newMap);
    }
  }, [map]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!map || !start.address || !end.address) return;

    try {
      const startCoords = await getCoordinates(start.address);
      const endCoords = await getCoordinates(end.address);

      if (startCoords && endCoords) {
        // Remove existing route if it exists
        if (routeControl) {
          map.removeControl(routeControl);
          setRouteControl(null); // Reset the routeControl state
        }

        // Remove existing markers if they exist
        if (startMarker) {
          startMarker.remove();
          setStartMarker(null); // Reset the start marker state
        }
        if (endMarker) {
          endMarker.remove();
          setEndMarker(null); // Reset the end marker state
        }

        // Add start marker
        const newStartMarker = L.marker([startCoords.lat, startCoords.lng], {
          icon: customIcon,
          draggable: true,
        }).addTo(map);

        // Add dragging event for start marker
        newStartMarker.on("dragend", (e) => {
          const latlng = e.target.getLatLng();
          setStart({ ...start, lat: latlng.lat, lng: latlng.lng });
        });

        setStartMarker(newStartMarker);

        // Add end marker
        const newEndMarker = L.marker([endCoords.lat, endCoords.lng], {
          icon: customIcon,
          draggable: true,
        }).addTo(map);

        // Add dragging event for end marker
        newEndMarker.on("dragend", (e) => {
          const latlng = e.target.getLatLng();
          setEnd({ ...end, lat: latlng.lat, lng: latlng.lng });
        });

        setEndMarker(newEndMarker);

        const control = L.Routing.control({
          waypoints: [
            L.latLng(startCoords.lat, startCoords.lng),
            L.latLng(endCoords.lat, endCoords.lng),
          ],
          routeWhileDragging: true,
        });

        // Save the route control to the state variable
        setRouteControl(control);

        control.addTo(map).route();
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  const getCoordinates = async (address) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1`
    );
    const data = await response.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  };

  const handleStartInputChange = async (e) => {
    const value = e.target.value;
    setStart({ ...start, address: value });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          value
        )}&format=json`
      );
      const data = await response.json();
      setStartSuggestions(data.map((item) => item.display_name));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setStartSuggestions([]);
    }
  };

  const handleEndInputChange = async (e) => {
    const value = e.target.value;
    setEnd({ ...end, address: value });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          value
        )}&format=json`
      );
      const data = await response.json();
      setEndSuggestions(data.map((item) => item.display_name));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setEndSuggestions([]);
    }
  };

  const handleSelectStartSuggestion = (address) => {
    setStart({ ...start, address });
    setStartSuggestions([]);
  };

  const handleSelectEndSuggestion = (address) => {
    setEnd({ ...end, address });
    setEndSuggestions([]);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="form">
        <div>
          <label className="label ">Start Point:</label>
          <input
            type="text"
            name="start"
            placeholder="Enter start address"
            value={start.address}
            onChange={handleStartInputChange}
          />
          <div className="suggestions">
            {startSuggestions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSelectStartSuggestion(item)}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <label>End Point:</label>
          <input
            type="text"
            name="end"
            placeholder="Enter end address"
            value={end.address}
            onChange={handleEndInputChange}
          />
          <div className="suggestions">
            {endSuggestions.map((item, index) => (
              <div key={index} onClick={() => handleSelectEndSuggestion(item)}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <button type="submit">Search</button>
      </form>
      <div id="map" style={{ height: "100vh", width: "100vw" }} />
    </div>
  );
};

export default MapComponent;
