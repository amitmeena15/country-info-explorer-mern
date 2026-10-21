# World Explorer (MERN)

A beginner-friendly MERN-stack project for exploring countries. This starter includes a React/Vite frontend and an Express backend that fetches country data through a server-side API route.

## Stack

- MongoDB + Mongoose (database configuration scaffold)
- Express + Node.js (REST API)
- React + Vite (frontend)
- REST Countries API (country data)

## Requirements

- Node.js 20 or newer
- npm
- MongoDB locally or a MongoDB Atlas connection for database features added later

## Run locally

1. Extract this project folder.
2. Open a terminal in `world-explorer-mern`.
3. Install root tooling: `npm install`
4. Install app dependencies: `npm run install:all`
5. Copy `.env.example` to `server/.env` and update `MONGODB_URI` if needed.
6. Start both apps: `npm run dev`
7. Open `http://localhost:5173`. The API runs on `http://localhost:5000`.

The starter's country listing works without MongoDB. MongoDB is prepared for the upcoming user/favourites features.

## Planned feature roadmap

1. API reliability: validation, loading/error states, retry, server-side caching.
2. Discovery: search, region filters, sorting, pagination.
3. Accounts and saved data: register/login with password hashing, JWT, MongoDB favourites.
4. Country detail pages and comparison.
5. Tests, accessibility, responsive polish, and documentation.

Make each feature in a separate branch and PR so Codzee can review the changes independently. Never put real secrets in GitHub; keep `.env` untracked.
