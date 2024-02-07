import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import customMarkerIcon from "leaflet/dist/images/marker-icon-2x.png";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { MDBBtn, MDBInput } from "mdb-react-ui-kit";
import logo from "./images/logo.png";
import * as H3 from "h3-js";
import "./MapComponent.css";

var S2 = require("s2-geometry").S2;
const MapComponent = () => {
  const [start, setStart] = useState({ address: "", lat: null, lng: null });
  const [end, setEnd] = useState({ address: "", lat: null, lng: null });
  const [map, setMap] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [routeControl, setRouteControl] = useState(null);
  const [drawControl, setDrawControl] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState(null);

  useEffect(() => {
    if (drawnFeatures) {
      map.on("draw:created", function (e) {
        const layer = e.layer;
        drawnFeatures.addLayer(layer);
        console.log(e.layer._latlngs);
        if (layer instanceof L.Circle) {
          const center = layer.getLatLng();
          const radius = layer.getRadius();
          console.log("Center:", center);
          console.log("Radius:", radius);
        }
      });
    }
  }, [drawnFeatures]);

  useEffect(() => {
    if (!map) {
      var newMap = L.map("map").setView([0, 0], 13);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          newMap.setView([latitude, longitude], 13);
        },
        (error) => {
          console.error("Error getting user's location:", error);
        }
      );

      const features = new L.FeatureGroup();
      newMap.addLayer(features);
      setDrawnFeatures(features);

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

      newMap.addControl(control);

      setMap(newMap);
      setDrawControl(control);

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
        if (routeControl) {
          map.removeControl(routeControl);
          setRouteControl(null);
        }

        const control = L.Routing.control({
          waypoints: [
            L.latLng(startCoords.lat, startCoords.lng),
            L.latLng(endCoords.lat, endCoords.lng),
          ],
          routeWhileDragging: true,
          createMarker: function (i, waypoint, n) {
            const marker = L.marker(waypoint.latLng, {
              draggable: true,
              bounceOnAdd: false,
              bounceOnAddOptions: {
                duration: 1000,
                height: 800,
              },
              icon: L.icon({
                iconUrl: customMarkerIcon,
                iconSize: [30, 40],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30],
              }),
            });
            const myPopup = L.popup().setContent("Popup content here");
            marker.on("dragend", function (event) {
              const latlng = event.target.getLatLng();
              console.log("New Latitude:", latlng.lat);
              console.log("New Longitude:", latlng.lng);
              console.log(event.target);
              const h3Cell = H3.latLngToCell(latlng.lat, latlng.lng, 7);
              console.log("H3 Cell:", h3Cell);
              var key = S2.latLngToKey(latlng.lat, latlng.lng, 15);
              console.log("S2 Key", key);
              console.log(S2.keyToId(key));
            });
            marker.bindPopup(myPopup).openPopup();
            return marker;
          },
        });

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
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "-100%",
                    left: 0,
                    zIndex: 999,
                  }}
                >
                  {startSuggestions.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectStartSuggestion(item)}
                      style={{
                        background: "white",
                        border: "1px solid black",
                        padding: "5px",
                        cursor: "pointer",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
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
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 999,
                  }}
                >
                  {endSuggestions.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectEndSuggestion(item)}
                      style={{
                        background: "white",
                        border: "1px solid black",
                        padding: "5px",
                        cursor: "pointer",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
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
            src={logo}
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

      <div id="map" style={{ height: "70vh", width: "100vw" }} />
    </>
  );
};

export default MapComponent;
