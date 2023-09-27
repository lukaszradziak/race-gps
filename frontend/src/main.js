import './styles/main.css'

import {GpsComponent} from "./components/gps-component.js";

document.querySelector('#app').innerHTML = `
  <div>
    <p class="logo">📡</p>
    <h1>Race GPS</h1>
    <div id="gps" class="card">
      <div class="data"></div>
      <button class="connect" type="button">Connect</button>
      <button class="disconnect" type="button">Disconnect</button>
      <button class="csv" type="button">CSV</button>
      <div class="log"></div>
    </div>
  </div>
`

GpsComponent(document.querySelector('#gps'))
