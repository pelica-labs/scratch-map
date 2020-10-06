import localforage from "localforage";
import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import Head from "next/head";
import React, { useEffect } from "react";

import { IState, useStore } from "../lib/store";

export default function Map() {
  const { map, featureCollection, set } = useStore();

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/outdoors-v11",
      center: [2, 48],
      zoom: 2,
      logoPosition: "bottom-right",
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    map.on("load", async () => {
      setStyle(map);

      set((state: IState) => {
        state.map = map;
      });

      try {
        const featureCollection = (await localforage.getItem(
          "featureCollection"
        )) as GeoJSON.FeatureCollection;
        if (featureCollection) {
          set((state) => {
            state.featureCollection = featureCollection;
          });
        }
      } catch (err) {
        console.log(err);
      }
    });
  }, []);

  useEffect(() => {
    if (map && map.getSource("features")) {
      (map.getSource("features") as GeoJSONSource).setData(featureCollection);
    }
  }, [featureCollection, map]);

  return (
    <div className="w-full h-full" id="map">
      <Head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>
    </div>
  );
}

function setStyle(map: mapboxgl.Map) {
  map.addSource("features", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  map.addLayer(
    {
      id: "fc",
      type: "fill",
      source: "features",
      layout: {},
      paint: {
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 9, 1],
        "fill-color": [
          "match",
          ["get", "kring"],
          [2],
          "hsla(233, 0%, 100%, 0.94)",
          [1],
          "hsla(0, 0%, 100%, 0.51)",
          0,
          "hsla(0, 0%, 100%, 0.17)",
          "hsla(0, 0%, 100%, 0.66)",
        ],
        "fill-outline-color": "hsla(0, 0%, 0%, 0)",
      },
    },
    "settlement-subdivision-label"
  );

  map.addLayer(
    {
      id: "fc-low-res",
      type: "fill",
      source: "features",
      layout: {},
      filter: ["==", ["get", "precision"], 3],
      paint: {
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          1,
          9,
          1,
          11,
          0,
        ],
        "fill-color": "hsla(233, 0%, 100%, 0.94)",
      },
    },
    "settlement-subdivision-label"
  );

  map.addLayer(
    {
      id: "water-fade",
      type: "fill",
      source: "composite",
      "source-layer": "water",
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          "hsl(231, 14%, 84%)",
          8.81,
          "hsla(231, 14%, 84%, 0.18)",
          12,
          "hsla(231, 14%, 84%, 0)",
        ],
      },
    },
    "settlement-subdivision-label"
  );

  map.addLayer(
    {
      id: "outlines",
      type: "line",
      source: "features",
      filter: ["match", ["get", "kring"], [2], true, false],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          "hsla(25, 65%, 64%, 0.69)",
          12.7,
          "hsla(25, 14%, 69%, 0.59)",
        ],
        "line-width": 2,
      },
    },
    "settlement-subdivision-label"
  );

  map.addLayer({
    id: "over-labels",
    type: "fill",
    source: "features",
    filter: ["match", ["get", "kring"], [2], true, false],
    layout: {},
    paint: {
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0, 8, 1],
      "fill-outline-color": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        "hsla(31, 60%, 65%, 0.88)",
        7.8,
        "hsla(0, 0%, 0%, 0)",
        22,
        "hsla(0, 0%, 0%, 0)",
      ],
      "fill-color": "hsla(0, 0%, 100%, 0.44)",
    },
  });
}
