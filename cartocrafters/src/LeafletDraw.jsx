import React, { useEffect } from "react";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";

const LeafletDraw = () => {
  useEffect(() => {
    // Initialize the map
    const map = L.map("map").setView([28.2096, 83.9856], 13);

    // Add the OpenStreetMap tiles
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );
    osm.addTo(map);

    // Leaflet draw
    const drawnFeatures = new L.FeatureGroup();
    map.addLayer(drawnFeatures);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnFeatures,
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
    map.addControl(drawControl);

    map.on("draw:created", function (e) {
      const type = e.layerType;
      const layer = e.layer;
      console.log(layer.toGeoJSON());

      layer.bindPopup(`<p>${JSON.stringify(layer.toGeoJSON())}</p>`);
      drawnFeatures.addLayer(layer);
    });

    map.on("draw:edited", function (e) {
      const layers = e.layers;
      const type = e.layerType;

      layers.eachLayer(function (layer) {
        console.log(layer);
      });
    });
  }, []);

  return <div id="map" style={{ height: "100vh", width: "100%" }}></div>;
};

export default LeafletDraw;
