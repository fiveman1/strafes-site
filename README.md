# epicstrafe 

This repository is based on the original MIT-licensed [`fiveman1/strafes-site`](https://github.com/fiveman1/strafes-site). The refreshed version and improvements were made by **@quadrics** on Discord.

## Improvements

- World record replay loading times cache
- Interface
- UX
  
## Requirements

- [Node.js](https://nodejs.org/) 22 or newer
- npm 10 or newer

## Run the public frontend locally

This is the quickest way to work on the project. In development, Vite proxies public `/api` requests to the original Strafes API.

```bash
git clone https://github.com/plusbyminuss-coder/epicstrafe.git
cd epicstrafe-main
npm install
npm run build:shared
npm run dev:frontend
```

Uses [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev:frontend    # Frontend only
npm run build:frontend  # Build shared package and frontend
npm run lint            # Check the source code
```

## Contributing

Issues and pull requests are welcome. Install dependencies with `npm install`, keep changes focused, and run `npm run lint` and `npm run build` before submitting. Do not commit credentials, `.env` files, databases, generated builds, or dependency folders.

For security issues involving authentication, credentials, cookies, or databases, contact the repository owner privately rather than opening a public issue. Never include live secrets in a report.

## Credits and license

- Original project: [fiveman1/strafes-site](https://github.com/fiveman1/strafes-site)
- Interface redesign and replay reliability improvements: **@quadrics**

Released under the [MIT License](LICENSE). The original copyright notice is preserved.
