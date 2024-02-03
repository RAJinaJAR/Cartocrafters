import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";

const DrawMap = () => {
  const [map, setMap] = useState(null);
  const [drawControl, setDrawControl] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState(null);

  useEffect(() => {
    // Initialize the map
    const newMap = L.map("map").setView([28.2096, 83.9856], 13);

    // Add the OpenStreetMap tiles
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(newMap);

    // Initialize the feature group for drawn items
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
    setMap(newMap);
    setDrawControl(control);

    // Cleanup function
    return () => {
      newMap.remove();
    };
  }, []);

  useEffect(() => {
    if (drawnFeatures) {
      map.on("draw:created", function (e) {
        const layer = e.layer;
        drawnFeatures.addLayer(layer);
      });
    }
  }, [drawnFeatures]);

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
    <div>
      <button onClick={toggleDrawMode}>
        {drawMode ? "Exit Draw Mode" : "Enter Draw Mode"}
      </button>
      <div id="map" style={{ height: "100vh", width: "100%" }}></div>
    </div>
  );
};

export default DrawMap;
