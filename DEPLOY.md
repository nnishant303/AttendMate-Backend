# Deploy guide — AttendMate Backend (Render) + Frontend (Netlify)

## A. Atlas (required before Render works)

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → **Project 0**
2. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
3. Confirm database user in **Database Access** can read/write `attendmate`

Without this, local may work but Render cannot reach MongoDB.

---

## B. Backend on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
2. Connect GitHub → select **`nnishant303/AttendMate-Backend`**
3. Settings:
   - **Name:** `attendmate-backend` (or any name)
   - **Branch:** `develop`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment** → add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Same as local `.env` (Atlas Project 0) |
| `JWT_SECRET` | Strong secret |
| `SESSION_SECRET` | Strong secret |
| `FRONTEND_URLS` | Leave empty first; set after Netlify URL exists |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | If using Gmail SMTP |
| `BREVO_API_KEY` / `BREVO_FROM_EMAIL` | If using Brevo |
| `GOOGLE_CLIENT_ID` | If Google login is used |

5. Deploy → wait until live
6. Smoke test in browser:

```text
https://<your-service>.onrender.com/api/health
```

Expect: `{ "ok": true, "time": "..." }`

Copy your Render base URL (without `/api`), e.g. `https://attendmate-backend-xxxx.onrender.com`.

Free Render services sleep after idle; first request may take ~30–60s.

---

## C. Frontend on Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connect GitHub → **`nnishant303/Attendance_Management`**
3. Build settings (also in `netlify.toml`):
   - **Branch:** `develop`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. **Site configuration** → **Environment variables** → add:

| Key | Value |
|-----|--------|
| `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | If used |
| `VITE_CLOUDINARY_UNSIGNED_PRESET` | If used |

5. Deploy site → copy Netlify URL, e.g. `https://something.netlify.app`

6. Google Cloud Console → OAuth client → add Netlify URL under **Authorized JavaScript origins**

---

## D. Wire CORS

1. Render → your service → **Environment**
2. Set:

```text
FRONTEND_URLS=https://something.netlify.app
```

3. Save → service redeploys  
4. Backend already allows `*.netlify.app` in code; `FRONTEND_URLS` is for the exact production origin (cookies/CORS).

---

## E. Verify

1. Open Netlify site → login
2. Browser DevTools → Network → API calls should hit your Render host
3. Atlas Project 0 → `attendmate` collections should update
4. Health: `https://<render>/api/health`
