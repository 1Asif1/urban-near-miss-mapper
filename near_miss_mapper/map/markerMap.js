// markerMap.js
// Simple Leaflet map for incident reporting

// Include this script in an HTML file with Leaflet CSS/JS loaded

// Example HTML:
// <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
// <div id="map" style="height: 500px;"></div>
// <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
// <script src="map/markerMap.js"></script>

window.onload = function() {
	// Initialize map
	var map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India

	// Add OpenStreetMap tiles
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '© OpenStreetMap'
	}).addTo(map);

	var marker;

	// Info box for coordinates
	var info = L.control({position: 'topright'});
	info.onAdd = function(map) {
		this._div = L.DomUtil.create('div', 'info');
		this._div.style.background = '#fff';
		this._div.style.padding = '8px';
		this._div.style.borderRadius = '4px';
		this._div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
		this.update();
		return this._div;
	};
	info.update = function(latlng) {
		if (latlng) {
			this._div.innerHTML = `<b>Incident Location:</b><br>Latitude: ${latlng.lat.toFixed(6)}<br>Longitude: ${latlng.lng.toFixed(6)}<br><br>Copy these coordinates for your Google Form.`;
		} else {
			this._div.innerHTML = 'Click on the map to mark the incident location.';
		}
	};
	info.addTo(map);

	// Map click event to place marker and show coordinates

	map.on('click', function(e) {
		if (marker) {
			map.removeLayer(marker);
		}
		marker = L.marker(e.latlng, {draggable: true}).addTo(map);
		window.marker = marker;
		info.update(e.latlng);

		// Auto-fill location in form
		const locInput = document.getElementById('incident-location');
		if (locInput) {
			locInput.value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
		}

		// Update info and form when marker is dragged
		marker.on('dragend', function(ev) {
			var pos = ev.target.getLatLng();
			info.update(pos);
			if (locInput) {
				locInput.value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
			}
		});
	});
};

function toggleReportForm() {
	const formContainer = document.getElementById('report-form-container');
	const sideContainer = document.getElementById('report-form-side-container');
	if (formContainer.style.display === 'block' || sideContainer.classList.contains('active')) {
		formContainer.style.display = 'none';
		sideContainer.classList.remove('active');
	} else {
		formContainer.style.display = 'block';
		sideContainer.classList.add('active');
	}
}

// Optional: handle form submission
document.addEventListener('DOMContentLoaded', function() {
  const reportForm = document.getElementById('report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', function(e) {
      e.preventDefault();
			// Collect incident data
			const incident = {};
			incident.id = 'INC' + Date.now();
			// Try to get location from marker if available
			let lat = null, lng = null;
			if (window.marker && window.marker.getLatLng) {
				const pos = window.marker.getLatLng();
				lat = pos.lat;
				lng = pos.lng;
			}
			incident.location = lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : reportForm.location.value;
			incident.description = reportForm.description.value;
			incident.incident_type = reportForm.incident_type.value;
			incident.severity = reportForm.severity.value;
			incident.timestamp = reportForm.timestamp.value || new Date().toISOString();
			incident.reported_by = reportForm.reported_by.value;

			// For demonstration, show the incident object
			alert('Incident reported!\n' + JSON.stringify(incident, null, 2));
			toggleReportForm();
			reportForm.reset();
    });
  }
});
