# minesweeper

## Build

1. install nodejs
2. in cmd navigate inside minesweeper-folder
3. type `npm install` to install dependencies
4. a) type `npm run build_electron` to build electron version
   b) type `npm run build_browser` to build web version
   
## Run

### Electron version
* execute exe in dist/electron_[build]/*

### Web Version
* install http-server by running `npm install http-server -g`
* run `http-server dist` to serve the application
* go to `http://127.0.0.1:8080` with your browser
