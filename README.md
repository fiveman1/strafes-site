# strafes-site

https://strafes.fiveman1.net/

Serves content from the StrafesNET Roblox bhop and surf games.

### Setup

`yarn install`

Make a `.env` in the root directory (this folder) with the following:

```sh
STRAFES_KEY=<your key>
```

#### To setup OAuth 2.0

Create a MySQL database named `strafes_auth_users`

Create the `sessions` and `settings` table (see `auth.sql`)

Add the following to your `.env`

```sh
AUTH_DB_USER=<your MySQL user>
AUTH_DB_PASSWORD=<your MySQL password>
ROBLOX_CLIENT_ID=<your Roblox OAuth 2.0 client ID>
ROBLOX_CLIENT_SECRET=<your Roblox OAuth 2.0 client secret>
BASE_URL=<the base URL for the site>, such as "https://strafes.fiveman1.net"
COOKIE_SECRET=<a randomly generated secret of your choice>
```

#### Globals

If using https://github.com/fiveman1/strafes-globals-db, then add

```sh
STRAFES_DB_USER=<your MySQL user>
STRAFES_DB_PASSWORD=<your MySQL password>
```

### Run dev server

`yarn run dev`

### Build production

`yarn run build`

### Run production server

`yarn run start`

### Build and run production server

`yarn run prod`
