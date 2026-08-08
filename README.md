# Soul Studio

GUI for [Soul](https://github.com/thevahidal/soul): a SQLite REST and realtime server.

Under active rebuild on SvelteKit 2 / Svelte 5 / TypeScript. Currently: auth
(login/logout, session persistence) against a Soul backend, same-origin or
cross-origin. The table/row browser and the rest of the feature set land in
the phases that follow -- see the project plan for the full roadmap.

## Development

Make sure that [Soul Core API](https://github.com/thevahidal/soul) is up and running and then

```bash
cp .env.sample .env # Duplicate sample environment variables
vim .env # Update the environment variables

npm install # Install dependencies
npm run dev # Start the dev server
```
