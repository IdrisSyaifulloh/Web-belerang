// src/components/MultiTiangMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import connectionService from '../services/connectionService';

// Warna marker per tiang
const TIANG_COLORS = {
  1: '#FF0000', // Merah
  2: '#00FF00', // Hijau
  3: '#0000FF', // Biru
  4: '#FFFF00', // Kuning
  5: '#FF00FF'  // Ungu
};

// Icon marker (bisa pakai URL atau buat SVG)
const getMarkerIcon = (tiangId) => {
  return {
    url: `https://maps.google.com/mapfiles/ms/icons/${TIANG_COLORS[tiangId].substring(1)}.png`,
    scaledSize: new window.google.maps.Size(32, 32)
  };
};

export default function MultiTiangMap({ currentTiangId }) {
  const mapRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const mapInstance = useRef(null);
  const markersRef = useRef({}); // {1: marker, 2: marker, ...}
  const [locations, setLocations] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null
  });

  // Load Google Maps API
  useEffect(() => {
    if (scriptLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDPCm3oQrKFUOvOr_Dg1yAjMcKuec3DNCg';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, [scriptLoaded]);

  // Subscribe ke data GPS semua tiang
  useEffect(() => {
    const unsubscribe = connectionService.subscribe('gps', (data) => {
      if (data.tiangId >= 1 && data.tiangId <= 5 && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setLocations(prev => ({
          ...prev,
          [data.tiangId]: { lat: data.lat, lng: data.lng }
        }));
      }
    });
    return () => unsubscribe?.();
  }, []);

  // Inisialisasi peta
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || mapInstance.current) return;

    const defaultCenter = { lat: -6.2088, lng: 106.8456 }; // Jakarta
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    });
  }, [scriptLoaded]);

  // Update marker saat lokasi berubah
  useEffect(() => {
    if (!mapInstance.current) return;

    Object.keys(locations).forEach(tiangId => {
      const loc = locations[tiangId];
      if (loc) {
        if (markersRef.current[tiangId]) {
          // Update marker yang sudah ada
          markersRef.current[tiangId].setPosition(loc);
        } else {
          // Buat marker baru
          markersRef.current[tiangId] = new window.google.maps.Marker({
            position: loc,
            map: mapInstance.current,
            icon: getMarkerIcon(Number(tiangId)),
            title: `Tiang ${tiangId}`
          });
        }
      }
    });

    // Atur ulang zoom agar semua marker terlihat
    const bounds = new window.google.maps.LatLngBounds();
    Object.values(locations).forEach(loc => {
      if (loc) bounds.extend(loc);
    });
    if (bounds.isEmpty()) {
      mapInstance.current.setCenter({ lat: -6.2088, lng: 106.8456 });
      mapInstance.current.setZoom(12);
    } else {
      mapInstance.current.fitBounds(bounds);
    }
  }, [locations]);

  return (
    <div className="w-[580px] h-[320px] bg-white p-4 rounded-lg shadow-md">
      {scriptLoaded ? (
        <div ref={mapRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
          Memuat peta...
        </div>
      )}
    </div>
  );
}