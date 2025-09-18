import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default marker icons in React Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ position, onPositionChange }) {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={defaultIcon}>
      <Popup>Report a near-miss event here</Popup>
    </Marker>
  );
}

function MapView() {
  const [position, setPosition] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchNearbyEvents(longitude, latitude);
      },
      (err) => {
        console.error("Error getting location:", err);
        setError("Unable to get your location. Please enable location services.");
        // Default to a central location if geolocation fails
        setPosition([51.505, -0.09]);
        fetchNearbyEvents(-0.09, 51.505);
      }
    );
  }, []);

  const fetchNearbyEvents = async (lng, lat) => {
    try {
      const response = await axios.get(`/api/events/nearby?lng=${lng}&lat=${lat}&radius_km=10`);
      let data = response.data;
      // Ensure we always set an array to prevent runtime errors when mapping
      if (!Array.isArray(data)) {
        data = [];
      }
      // Fallback: if nearby endpoint not implemented or returns empty, try fetching all events
      if (data.length === 0) {
        try {
          const all = await axios.get('/api/events/');
          if (Array.isArray(all.data)) {
            data = all.data;
          }
        } catch (e) {
          // ignore, will show error below
        }
      }
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load near-miss events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    setPosition([latlng.lat, latlng.lng]);
    // Here you could open a form to report a new near-miss event
    console.log("Map clicked at:", latlng);
  };

  if (loading) {
    return <div className="map-loading">Loading map...</div>;
  }

  if (error) {
    return <div className="map-error">{error}</div>;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {position && (
          <LocationMarker 
            position={position} 
            onPositionChange={handleMapClick} 
          />
        )}
        {/* Render near-miss event markers */}
        {events.map((event, index) => (
          <Marker 
            key={index} 
            position={[event.location.coordinates[1], event.location.coordinates[0]]}
            icon={defaultIcon}
          >
            <Popup>
              <div>
                <h3>{event.incident_type}</h3>
                <p>{event.description}</p>
                <p>Severity: {event.severity}</p>
                <p>Reported on: {new Date(event.timestamp).toLocaleDateString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;
