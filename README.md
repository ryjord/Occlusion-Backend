Live server web address : private for obvious reasons

### Getting Started
Before we run the server we need to make sure you install all packages
```bash
  npm install
```
Next run development server:

```bash
  npm run dev
```

Open http://localhost:3001


please note, running this locally doesnt affect the app as the app only relies on the live backend. local frontend relies on local backend though.

going to live deployment works regardless.

### .env content required
DATABASE_URL=""
JWT_SECRET=""
ADMIN_SEED_PASSWORD=""

by default for assessment the .env is already included for your ease of use.
