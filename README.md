# 📡 Race GPS

[![Netlify Status](https://api.netlify.com/api/v1/badges/427640b1-496f-4691-a2be-fb90ec9e0255/deploy-status)](https://app.netlify.com/sites/race-gps/deploys)

https://race-gps.netlify.app

# Preview

<img width="150" alt="image" src="https://github.com/lukaszradziak/race-gps/assets/1611323/f3024eac-58c4-47a9-bbe8-70fc2ba0ab84">
<img width="150" alt="image" src="https://github.com/lukaszradziak/race-gps/assets/1611323/c3aa0147-f34a-4d1b-82d3-b5f8c1982dab">
<img width="150" alt="image" src="https://github.com/lukaszradziak/race-gps/assets/1611323/504a501e-28a9-4c89-ac36-918832e6fb0b">

# Model 3D

https://www.thingiverse.com/thing:4724205

<img width="150" alt="image" src="https://github.com/lukaszradziak/race-gps/assets/1611323/5ae62e3d-abcd-4d5f-94e9-b298494f22bb">
<img width="150" alt="image" src="https://github.com/lukaszradziak/race-gps/assets/1611323/d2d15ee1-2a13-4c4d-9932-11132fdc98da">
<img width="150" alt="image" src="https://github.com/lukaszradziak/race-gps/assets/1611323/92d7b461-f9ed-4176-95f7-3949d10c712d">

# How to run on mobile

* (iPhone) Install and open [Bluefy](https://apps.apple.com/pl/app/bluefy-web-ble-browser/id1492822055)
* (Android) Open Google Chrome
* Go to https://race-gps.netlify.app
* Connect to ESP32

## Hardware requirements

* ESP32
* GPS 10Hz: VK2828U7G5LF

## Board configuration

IMPORTANT! Before compiling sketch, copy `board_config.cpp.default` to `src/board_config.cpp`!
Then if you want to overwrite defualt GPS board pinout configuration edit suitable pin numbers.

## Build board

* Install PlatformIO
* Platformio -> esp32dev -> Upload

## Frontend development

* Install node.js
* `cd frontend`
* `npm install`
* `npm run dev`
* Go to http://localhost:5173/

## Storage API

Mini app for synchronization data with API:
https://github.com/lukaszradziak/storage-api
