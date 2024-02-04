import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import customMarkerIcon from "leaflet/dist/images/marker-icon-2x.png";
import { Icon } from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { MDBBtn, MDBInput } from "mdb-react-ui-kit";
import pic from "./images/pic.png";
import "./MapComponent.css";

const MapComponent = () => {
  const [start, setStart] = useState({ address: "", lat: null, lng: null });
  const [end, setEnd] = useState({ address: "", lat: null, lng: null });
  const [map, setMap] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [routeControl, setRouteControl] = useState(null);

  const [drawControl, setDrawControl] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState(null);

  const customIcon = new L.Icon({
    iconUrl: customMarkerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  useEffect(() => {
    if (drawnFeatures) {
      map.on("draw:created", function (e) {
        const layer = e.layer;
        drawnFeatures.addLayer(layer);
        console.log(e.layer._latlngs);
      });
    }
  }, [drawnFeatures]);

  useEffect(() => {
    if (!map) {
      // Initialize Leaflet map
      var newMap = L.map("map").setView([0, 0], 13); // Default to [0, 0]

      // Get user's current location and set the map view
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          newMap.setView([latitude, longitude], 13);
        },
        (error) => {
          console.error("Error getting user's location:", error);
        }
      );

      // Add the OpenStreetMap tiles
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ).addTo(newMap);

      const features = new L.FeatureGroup();
      newMap.addLayer(features);
      setDrawnFeatures(features);

      // Initialize the draw control
      const control = new L.Control.Draw({
        edit: {
          featureGroup: features,
          remove: false,
        },
        draw: {
          polygon: {
            shapeOptions: {
              color: "purple",
            },
          },
          polyline: {
            shapeOptions: {
              color: "red",
            },
          },
          rect: {
            shapeOptions: {
              color: "green",
            },
          },
          circle: {
            shapeOptions: {
              color: "steelblue",
            },
          },
        },
      });

      // Add the draw control to the map
      newMap.addControl(control);

      // Set map object to state
      setMap(newMap);
      setDrawControl(control);

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

  const toggleDrawMode = () => {
    if (map && drawControl) {
      if (!drawMode) {
        map.addControl(drawControl);
        setDrawMode(true);
      } else {
        map.removeControl(drawControl);
        setDrawMode(false);
      }
    }
  };

  return (
    <>
      <div className="column-container">
        <div className="first-div">
          <form onSubmit={handleSearch} style={{ padding: "30px" }}>
            <div>
              <div
                style={{
                  marginLeft: "5px",
                  marginTop: "8px",
                  marginBottom: "5px",
                  width: "75%",
                }}
              >
                <MDBInput
                  size="sm"
                  label="Enter you start point"
                  type="text"
                  name="start"
                  placeholder="Enter start address"
                  value={start.address}
                  onChange={handleStartInputChange}
                />
              </div>
              <div>
                {startSuggestions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectStartSuggestion(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div
                style={{ marginLeft: "5px", marginBottom: "5px", width: "75%" }}
              >
                <MDBInput
                  size="sm"
                  label="Enter you end point"
                  type="text"
                  name="end"
                  placeholder="Enter end address"
                  value={end.address}
                  onChange={handleEndInputChange}
                />
              </div>
              <div>
                {endSuggestions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectEndSuggestion(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginLeft: "5px",
                  display: "flex",
                  marginBottom: "5px",
                  width: "75%",
                  justifyContent: "space-between",
                }}
              >
                <MDBBtn type="submit" size="sm">
                  Search
                </MDBBtn>
                <MDBBtn
                  size="sm"
                  onClick={toggleDrawMode}
                  style={{ marginLeft: "185px" }}
                >
                  {drawMode ? "Exit Draw Mode" : "Enter Draw Mode"}
                </MDBBtn>
              </div>
            </div>
          </form>
        </div>

        <div className="second-div">
          <img
            src={pic} // Replace with the actual image URL
            alt="Your Image"
            style={{
              width: "200px",
              height: "200px",
              float: "right",
              transform: "scale(0.7)",
            }}
          />
        </div>
      </div>

      <div id="map" style={{ height: "79vh", width: "100vw" }} />
    </>
  );
};

export default MapComponent;
