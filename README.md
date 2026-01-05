# strafes-site

https://strafes.fiveman1.net/

Serves content from the StrafesNET Roblox bhop and surf games.

### Setup

`yarn install`

Make a `.env` in the root directory (this folder) with the following:

```sh
STRAFES_KEY=<your key>
```

If using https://github.com/fiveman1/strafes-globals-db, then add
```sh
DB_USER=<your MySQL user>
DB_PASSWORD=<your MySQL password>
```

### Run dev server

`yarn run dev`

### Build production

`yarn run build`

### Run production server

`yarn run start`

### Build and run production server

`yarn run prod`
