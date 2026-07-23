<h1 align='center'> Future Safe Her — Backend API<h1>

Production-ready Node.js / Express / MongoDB backend for **Future Safe Her**, an AI-powered women safety platform. Built to match the existing frontend exactly — no extra pages, no missing features.

## Tech Stack

- **Runtime:** Node.js + Express.js
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** JWT (access + refresh tokens) + bcrypt
- **Real-time:** Socket.io (live location tracking, SOS broadcast)
- **Media storage:** Cloudinary (profile images, voice recordings, evidence vault)
- **Push notifications:** Firebase Cloud Messaging (FCM)
- **AI Assistant:** Groq API only (`llama-3.3-70b-versatile`) — **never OpenAI**
- **Routing / maps:** OSRM (free routing) + OpenStreetMap Overpass API (nearby places) — no paid Google Maps key required
- **Security:** Helmet, express-rate-limit, express-mongo-sanitize, xss-clean, express-validator
- **Email:** Nodemailer (forgot / reset password)
- **File uploads:** Multer (memory storage → streamed to Cloudinary)

## Project Structure

```
backend/
├── config/          # DB, Cloudinary, Firebase configuration
├── controllers/      # Route handler logic
├── middleware/        # auth, error handling, rate limiting, validation, uploads
├── models/            # Mongoose schemas
├── routes/            # Express routers
├── services/           # Groq, Cloudinary, FCM, email, OSRM, Overpass integrations
├── socket/              # Socket.io real-time handlers
├── utils/                # ApiError, ApiResponse, token helpers, geo helpers
├── uploads/               # (unused placeholder — uploads stream directly to Cloudinary)
├── app.js
├── server.js
├── package.json
└── .env.example
```

## Getting Started

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Fill in: MongoDB URI, JWT secrets, Cloudinary credentials, Firebase service account, Groq API key, SMTP credentials.

### 3. Run the server
```bash
npm run dev     # development (nodemon)
npm start       # production
```

The API will be available at `http://localhost:5000/api/v1` and Socket.io on the same port.

Health check: `GET /health`

## Authentication

All protected routes require:
```
Authorization: Bearer <accessToken>
```

Tokens are issued on register/login (`accessToken` + `refreshToken`). Use `POST /api/v1/auth/refresh-token` to get a new access token when it expires.

## API Reference (base path: `/api/v1`)

### Auth — `/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Log in |
| POST | `/logout` | Log out |
| POST | `/refresh-token` | Refresh access token |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password/:token` | Reset password with emailed token |
| PATCH | `/update-password` | Change password (authenticated) |
| DELETE | `/delete-account` | Deactivate account |
| GET | `/me` | Get current user |

### Users — `/users` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| PATCH | `/profile` | Update name / blood group / allergies / language |
| PATCH | `/preferences` | Update notification/privacy/guardian toggles |
| PATCH | `/voice-guardian` | Update secret code word & trigger words |
| POST | `/profile-image` | Upload profile photo (multipart `image`) |
| DELETE | `/profile-image` | Remove profile photo |
| GET | `/dashboard-summary` | Home screen summary data |

### Emergency Contacts — `/contacts` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List contacts |
| POST | `/` | Add contact |
| GET | `/:id` | Get one contact |
| PATCH | `/:id` | Update contact |
| DELETE | `/:id` | Delete contact |
| PATCH | `/reorder` | Reorder priority |

### SOS — `/sos` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/trigger` | Trigger SOS: saves location, Google Maps link, notifies contacts |
| PATCH | `/:id/resolve` | Mark alert resolved / cancelled / false alarm |
| GET | `/history` | Past alerts |
| GET | `/:id` | One alert |

### Live Tracking — `/tracking` (all authenticated, + Socket.io)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/start` | Start a journey |
| GET | `/active` | Get current active session |
| PATCH | `/:id/location` | REST fallback location update |
| POST | `/:id/timeline` | Add a timeline milestone |
| PATCH | `/:id/stop` | Stop tracking |
| GET | `/:id` | Get a session |

**Socket.io events:** `tracking:start`, `tracking:location-update`, `tracking:stop`, `tracking:watch` (client emits) → `tracking:location`, `tracking:started`, `tracking:stopped` (server emits). Connect with `auth: { token: accessToken }`.

### Voice Guardian recordings — `/voice` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/recordings` | List recordings |
| POST | `/recordings` | Upload audio (multipart `audio`) |
| DELETE | `/recordings/:id` | Delete a recording |

### Evidence Vault — `/evidence` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List evidence |
| POST | `/` | Upload audio/video/photo (multipart `file`, field `type`) |
| GET | `/report` | Emergency report data (for "Download Emergency Report") |
| DELETE | `/:id` | Delete evidence |

### Fake Call — `/fake-calls` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List caller presets |
| POST | `/` | Create preset |
| PATCH | `/:id` | Update preset |
| DELETE | `/:id` | Delete preset |
| POST | `/:id/trigger` | Trigger a fake call |

### Community — `/community` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts` | Paginated feed |
| POST | `/posts` | Create post (multipart `image` optional) |
| DELETE | `/posts/:id` | Delete own post |
| POST | `/posts/:id/like` | Like |
| DELETE | `/posts/:id/like` | Unlike |
| POST | `/posts/:id/comments` | Comment |
| POST | `/posts/:id/comments/:commentId/replies` | Reply to comment |

### AI Assistant (Groq only) — `/assistant` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/message` | Send a message, get an AI reply (JSON) |
| GET | `/conversation` | Get active conversation history |
| DELETE | `/conversation` | Clear/end conversation |

The chatbot is restricted to women safety, emergency, self defence, cyber crime, women's rights, legal help, nearby help, mental support and safety tips. Off-topic questions are redirected. Powered exclusively by Groq (`llama-3.3-70b-versatile`).

### Safe Route — `/safe-route` (authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/?fromLat=&fromLng=&toLat=&toLng=&profile=foot\|driving` | AI-ranked route options with safety scores |

### Nearby — `/nearby` (authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/?lat=&lng=&category=police\|hospital\|pharmacy\|metro&radius=` | Nearby places by category |
| GET | `/all?lat=&lng=&radius=` | All categories combined |

### Crime Heatmap — `/heatmap` (authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/zones?lat=&lng=&radiusKm=` | Nearby unsafe zones for the heatmap |
| GET | `/reports` | List crime reports |
| POST | `/reports` | Submit a crime report |

### Notifications — `/notifications` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List notifications |
| PATCH | `/:id/read` | Mark one as read |
| PATCH | `/read-all` | Mark all as read |
| POST | `/device-token` | Register FCM device token |
| DELETE | `/device-token` | Remove FCM device token |

### Ride Guardian — `/ride` (all authenticated)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/start` | Start monitoring a ride |
| GET | `/active` | Current active ride |
| PATCH | `/:id/location` | Update vehicle location → recomputes ETA |
| PATCH | `/:id/share` | Toggle ride sharing with contacts |
| PATCH | `/:id/complete` | Mark ride complete |

## Response Shape

All responses follow:
```json
{ "success": true, "message": "...", "data": { } }
```
Errors:
```json
{ "success": false, "message": "...", "errors": [] }
```

## Security Notes

- Passwords hashed with bcrypt (configurable salt rounds).
- JWT access + refresh token pattern.
- Helmet, CORS allow-list, mongo-sanitize, xss-clean applied globally.
- Global + auth + SOS + chatbot specific rate limiters.
- Express-validator on all write endpoints that accept user input.
- Cloudinary used for all media — no local file persistence.
- Groq API key is read only from `.env` server-side and never returned to the client.

## Postman Collection

Import `Future-Safe-Her.postman_collection.json` (in this folder) into Postman. Set the collection variable `baseUrl` to `http://localhost:5000/api/v1` and `accessToken` after logging in.
