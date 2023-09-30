import './styles/main.css';

import { GpsComponent } from './components/gps-component.js';

document.querySelector('#app').innerHTML = `
  <div>
    <h1 class="logo">📡 Race GPS</h1>
    <div id="gps-component">
      <div class="card">
        <div class="data"></div>
        <div class="real-time"></div>
        <button class="connect" type="button">Connect</button>
        <button class="disconnect" type="button">Disconnect</button>
        <button class="csv" type="button">CSV</button>
        <div class="log"></div>
        <div style="display: ${window.location.hash === '#test' ? 'block' : 'none'}">
            <div class="test-speed-value"></div>
            <input type="range" class="test-speed" min="-10" max="300" step="0.01" value="30" />
        </div>
        <div class="measure-result"></div>
      </div>
      <div class="modal-bg">
        <div class="modal"></div>
      </div>
    </div>
  </div>
`;

GpsComponent(document.querySelector('#gps-component'));
