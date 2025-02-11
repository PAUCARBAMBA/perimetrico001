// Initialize map with satellite base layer
var map = L.map('map', {
  fullscreenControl: true,
  fullscreenControlOptions: {
      title: "Mostrar mapa completo",
      titleCancel: "Salir del mapa completo"
  }
}).setView([-13.29188 , -72.19821], 18);

// Set zoom constraints
map.options.minZoom = 1;
map.options.maxZoom = 28;

// Add satellite base layer
L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  attribution: '&copy; Google Satellite',
  maxZoom: 28,
}).addTo(map);

// Create professional popup for land parcel
function createParcelPopup(feature, layer) {
  if (feature.properties) {
      var area_ha = feature.properties.area_m2.toFixed(4);
      var area_m2 = feature.properties.area_m2dos.toFixed(2);
      var perimeter = feature.properties.perimetro.toFixed(2);

      var popupContent = `
          <div class="parcel-popup">
              <div class="popup-header">
                  <i class="fas fa-map-marker-alt"></i>
                  <h2>Información</h2>
              </div>
              <div class="popup-content">
                  <div class="info-grid">
                      <div class="info-item">
                          <div class="info-label">Área (Ha)</div>
                          <div class="info-value">${area_ha}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Área (m²)</div>
                          <div class="info-value">${area_m2}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Perímetro (m)</div>
                          <div class="info-value">${perimeter}</div>
                      </div>

                  </div>
                  <div class="popup-actions">
                      <a href="https://paucarbamba.github.io/verificador/" class="action-button primary">
                          <i class="fas fa-map"></i>
                          <span>Descargar Plano</span>
                      </a>
                      <a href="https://paucarbamba.github.io/verificador/" class="action-button secondary">
                          <i class="fas fa-file-alt"></i>
                          <span>Ver Verificacion</span>
                      </a>
                  </div>
              </div>
          </div>
      `;
      layer.bindPopup(popupContent, {
          maxWidth: 400,
          className: 'modern-popup'
      });
  }
}

// Create professional popup for GNSS points
function createGNSSPopup(feature, layer) {
  if (feature.properties) {
      var popupContent = `
          <div class="gnss-popup">
              <div class="popup-header">
                  <i class="fas fa-satellite"></i>
                  <h2>Punto de Control GNSS</h2>
              </div>
              <div class="popup-content">
                  <div class="info-grid">
                      <div class="info-item">
                          <div class="info-label">Código</div>
                          <div class="info-value">${feature.properties.Code}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Este (m)</div>
                          <div class="info-value">${feature.properties.Easting.toFixed(3)}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Norte (m)</div>
                          <div class="info-value">${feature.properties.Northing.toFixed(3)}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Elevación (m)</div>
                          <div class="info-value">${feature.properties.Elevation.toFixed(3)}</div>
                      </div>
                      <div class="info-item full">
                          <div class="info-label">Coordenadas</div>
                          <div class="info-value coordinates">
                              ${feature.properties.Latitude.toFixed(8)}°, ${feature.properties.Longitude.toFixed(8)}°
                          </div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Alt. Elipsoidal</div>
                          <div class="info-value">${feature.properties["Ellipsoidal height"].toFixed(3)} m</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Sistema</div>
                          <div class="info-value">${feature.properties["CS name"]}</div>
                      </div>
                  </div>
              </div>
          </div>
      `;
      layer.bindPopup(popupContent, {
          maxWidth: 400,
          className: 'modern-popup'
      });
  }
}

// Add GeoJSON layers with custom styles
var tg_lote = L.geoJson(tg_lote, {
  className: 'lote',
  style: {
      color: '#2196F3',
      weight: 2,
      opacity: 1,
      fillColor: '#2196F3',
      fillOpacity: 0.2
  },
  onEachFeature: createParcelPopup
}).addTo(map);

var gnss = L.geoJson(gnss, {
  className: 'gnss',
  pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, {
          radius: 8,
          fillColor: "#FF5722",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
      });
  },
  onEachFeature: createGNSSPopup
}).addTo(map);

// Add layer control
var overlayMaps = {
  "Predio Rural": tg_lote,
  "Puntos de Control GNSS": gnss
};

L.control.layers(null, overlayMaps, {
  position: 'topright',
  collapsed: false
}).addTo(map);

// Add mouse position and box zoom controls
L.control.mousePosition().addTo(map);
L.Control.boxzoom({ position: 'topright' }).addTo(map);

// Add measurement tools
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
  edit: {
      featureGroup: drawnItems
  },
  draw: {
      polygon: {
          allowIntersection: false,
          showArea: true
      },
      polyline: {
          metric: true
      },
      circle: false,
      rectangle: false,
      marker: false,
      circlemarker: false
  }
});
map.addControl(drawControl);

map.on('draw:created', function(e) {
  var type = e.layerType,
      layer = e.layer;

  if (type === 'polygon') {
      var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
      var perimeter = layer.getLatLngs()[0].reduce(function(sum, latlng) {
          return sum + (latlng.distanceTo(layer.getLatLngs()[0][(layer.getLatLngs()[0].indexOf(latlng) + 1) % layer.getLatLngs()[0].length]) || 0);
      }, 0);
      layer.bindPopup('Área: ' + L.GeometryUtil.readableArea(area, true) + '<br>Perímetro: ' + perimeter.toFixed(2) + ' m');
  } else if (type === 'polyline') {
      var distance = layer.getLatLngs().reduce(function(sum, latlng) {
          return sum + (latlng.distanceTo(layer.getLatLngs()[layer.getLatLngs().indexOf(latlng) + 1]) || 0);
      }, 0);
      layer.bindPopup('Distancia: ' + distance.toFixed(2) + ' m');
  }

  drawnItems.addLayer(layer);
});

// Add modern CSS styles
var style = document.createElement('style');
style.textContent = `
  .modern-popup .leaflet-popup-content-wrapper {
      padding: 0;
      overflow: hidden;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }

  .modern-popup .leaflet-popup-content {
      margin: 0;
      width: 340px !important;
  }

  .popup-header {
      background: linear-gradient(135deg, #1976D2, #2196F3);
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
  }

  .popup-header i {
      font-size: 20px;
  }

  .popup-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
  }

  .popup-content {
      padding: 20px;
      background: white;
  }

  .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;
  }

  .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
  }

  .info-item.full {
      grid-column: 1 / -1;
  }

  .info-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
  }

  .info-value {
      font-size: 14px;
      color: #333;
      font-weight: 500;
  }

  .info-value.coordinates {
      font-family: monospace;
      background: #f5f5f5;
      padding: 6px 10px;
      border-radius: 4px;
  }

  .popup-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
  }

  .action-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
  }

  .action-button.primary {
      background: #2196F3;
      color: white;
  }

  .action-button.secondary {
      background: #E3F2FD;
      color: #2196F3;
  }

  .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .leaflet-control-layers {
      border: none;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  }

  .leaflet-control-layers-toggle {
      width: 36px;
      height: 36px;
  }
`;
document.head.appendChild(style);
