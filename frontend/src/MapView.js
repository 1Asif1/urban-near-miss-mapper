import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { createEvent, deleteEvent } from './api';
import ReportButton from './components/ReportButton';

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
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    description: '',
    incident_type: '',
    severity: 'low',
    reported_by: '',
    timestamp: '' // HTML datetime-local value (e.g., 2025-09-18T11:30)
  });

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

  const toDateTimeLocal = (d) => {
    // convert Date to YYYY-MM-DDTHH:mm for input[type=datetime-local]
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const handleMapClick = (latlng) => {
    setPosition([latlng.lat, latlng.lng]);
    // If the form is already open, keep it open and update the location
    console.log("Map clicked at:", latlng);
  };

  const openForm = () => {
    setShowForm(true);
    setForm((prev) => ({ ...prev, timestamp: toDateTimeLocal(new Date()) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return;
    const [lat, lng] = position;
    const payload = {
      location: { type: 'Point', coordinates: [lng, lat] },
      description: form.description,
      incident_type: form.incident_type,
      severity: form.severity,
      reported_by: form.reported_by || 'anonymous',
      timestamp: form.timestamp ? new Date(form.timestamp).toISOString() : undefined,
      additional_info: {}
    };
    try {
      setSubmitting(true);
      const created = await createEvent(payload);
      // Optimistically add the new event to the map
      setEvents((prev) => Array.isArray(prev) ? [...prev, created] : [created]);
      setShowForm(false);
      setForm({ description: '', incident_type: '', severity: 'low', reported_by: '', timestamp: '' });
    } catch (err) {
      console.error('Failed to create event:', err);
      setError('Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="map-loading">Loading map...</div>;
  }

  if (error) {
    return <div className="map-error">{error}</div>;
  }

  return (
    <div className="map-container" style={{ position: 'relative' }}>
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
            key={event.id || index} 
            position={[event.location.coordinates[1], event.location.coordinates[0]]}
            icon={defaultIcon}
          >
            <Popup>
              <div>
                <h3>{event.incident_type}</h3>
                <p>{event.description}</p>
                <p>Severity: {event.severity}</p>
                <p>Reported on: {new Date(event.timestamp).toLocaleDateString()}</p>
                {event.id && (
                  <button
                    onClick={async () => {
                      try {
                        await deleteEvent(event.id);
                        setEvents((prev) => prev.filter((e) => e.id !== event.id));
                      } catch (err) {
                        console.error('Delete failed', err);
                        setError('Failed to remove event.');
                      }
                    }}
                    style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #dc2626', background: '#ef4444', color: 'white' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Report Incident button (hidden while form is open) */}
      {!showForm && <ReportButton onClick={openForm} />}

      {showForm && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 320,
            background: '#ffffff',
            color: '#111827',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            padding: 16,
            zIndex: 1000
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 12, fontWeight: 700 }}>Report Incident</h3>
          <form onSubmit={handleSubmit}>
            {/* Location (read-only) */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Location:</label>
              <input
                type="text"
                value={position ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : ''}
                readOnly
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', color: '#111827' }}
              />
              {!position && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                  Click on the map to set a location.
                </div>
              )}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Incident Type:</label>
              <input
                type="text"
                name="incident_type"
                value={form.incident_type}
                onChange={handleChange}
                placeholder="Any incident type"
                required
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', background: '#ffffff', color: '#111827' }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Severity:</label>
              <select
                name="severity"
                value={form.severity}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', background: '#ffffff', color: '#111827' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Description:</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the incident"
                required
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', background: '#ffffff', color: '#111827' }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Timestamp:</label>
              <input
                type="datetime-local"
                name="timestamp"
                value={form.timestamp}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', background: '#ffffff', color: '#111827' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Reported By:</label>
              <input
                type="text"
                name="reported_by"
                value={form.reported_by}
                onChange={handleChange}
                placeholder="Your name or ID"
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', background: '#ffffff', color: '#111827' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="submit" disabled={submitting} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #16a34a', background: submitting ? '#16a34a' : '#22c55e', color: 'white', fontWeight: 600 }}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #9ca3af', background: '#e5e7eb', color: '#374151', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default MapView;
