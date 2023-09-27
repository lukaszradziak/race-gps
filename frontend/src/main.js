import './styles/main.css';

import { GpsComponent } from './components/gps-component.js';

document.querySelector('#app').innerHTML = `
  <div>
    <h1 class="logo">📡 Race GPS</h1>
    <div id="gps-component">
      <div class="card">
        <div class="data"></div>
        <button class="connect" type="button">Connect</button>
        <button class="disconnect" type="button">Disconnect</button>
        <button class="csv" type="button">CSV</button>
        <div class="log"></div>
        <div class="test-speed-value"></div>
        <input type="range" class="test-speed" min="0" max="300" value="30" />
        <div class="test-speed-result"></div>
      </div>
    </div>
  </div>
`;

GpsComponent(document.querySelector('#gps-component'));
