# strafes-site

https://strafes.fiveman1.net/

Serves content from the StrafesNET Roblox bhop and surf games.

## Just frontend setup

Use this if you just want to make changes to the frontend and don't want to bother setting up the backend. This allows you to run the frontend from source and proxy all backend requests to https://strafes.fiveman1.net/. You can easily test and make changes to files under the `client` directory this way.

`yarn install`

`yarn build`

Run the frontend website

`yarn run dev-proxy`

## Full setup (frontend + backend)

`yarn install`

`yarn build`

Make a `.env` in the root directory (this folder) with the following:

```sh
STRAFES_KEY=<your key>
```

### Setup OAuth 2.0

Create a MySQL database named `strafes_auth_users`

Create the `sessions` and `settings` table (see `server/sql/auth.sql`)

Add the following to your `.env`

```sh
AUTH_DB_USER=<your MySQL user>
AUTH_DB_PASSWORD=<your MySQL password>
ROBLOX_CLIENT_ID=<your Roblox OAuth 2.0 client ID>
ROBLOX_CLIENT_SECRET=<your Roblox OAuth 2.0 client secret>
BASE_URL=<the base URL for the site>, such as "https://strafes.fiveman1.net"
COOKIE_SECRET=<a randomly generated secret of your choice>
```

### Setup strafes_globals DB

You will need to setup and run https://github.com/fiveman1/strafes-globals-db then add the following to your `.env`

```sh
STRAFES_DB_USER=<your MySQL user>
STRAFES_DB_PASSWORD=<your MySQL password>
```

### Setup account links (optional)

The Discord <-> Roblox account links and the public API (`/public-api/v1`, docs at `/public-api/docs`) use a `strafes_links` database. Create it with `server/sql/links.sql`.

It's accessed with the auth DB's user unless you add these to your `.env`:

```sh
LINKS_DB_USER=<your MySQL user>
LINKS_DB_PASSWORD=<your MySQL password>
```

API keys are managed with a script (after `yarn build`; `keys:dev` runs it from source):

```sh
yarn workspace server run keys list
yarn workspace server run keys create --name "strafes bot" --owner <discord id> --permissions lookup,link --webhook http://127.0.0.1:8090/link-events
yarn workspace server run keys permissions <id> lookup,link
yarn workspace server run keys webhook <id> <url | none>
yarn workspace server run keys revoke <id>
```

`server/sql/links_import.sql` imports the data from the old rbhopdog-verify API, and `server/openapi/` has the API's docs. The old API's routes are served at `/public-api/legacy/v1/*`, for nginx to send `api.fiveman1.net/v1/*` to.

## How to build/run/dev

### Run dev server

`yarn run dev`

### Build production

`yarn build`

### Run production server

`yarn start`

## Credits

Reaction emoji graphics are from [Twemoji](https://github.com/jdecked/twemoji), Copyright 2019 Twitter, Inc and other contributors, licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
