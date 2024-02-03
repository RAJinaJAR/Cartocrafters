import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import MapWithDirections from "./MapWithDirections";
import reportWebVitals from "./reportWebVitals";
import MapComponent from "./MapComponent";
import "leaflet/dist/leaflet.css";
import DrawMap from "./DrawMap";
import LeafletDraw from "./LeafletDraw";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<DrawMap />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
