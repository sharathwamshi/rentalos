# RentalOS — Property & Tenant Management Platform

A full rebuild of the tenant-management app, with everything the original had
plus every gap we identified: maintenance tickets, tenant-initiated vacate
requests, online rent payments, e-signed agreements, lease renewals, a
document repository, owner-configurable reminders/late fees, visitor logs,
meter readings, in-app + WhatsApp/SMS/Telegram notifications, and a Super
Admin layer that runs the whole platform and manages owner subscriptions.

Three portals, one codebase:
- **Owner Portal** — properties, tenants, agreements, invoices, reports, subscription
- **Tenant Portal** — my room, agreements (e-sign), pay rent online, maintenance, vacate notice
- **Admin Portal** — manages every owner, subscription plans, and the Telegram/WhatsApp/Twilio/Razorpay keys that power the whole platform

## Stack

- **Backend:** Flask, SQLAlchemy, MySQL (PyMySQL), Flask-JWT-Extended, Flask-Migrate
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts, Lucide icons
- **Integrations:** Twilio (SMS + WhatsApp), Telegram Bot API, Razorpay (payments) — all configured live from Admin ▸ Integration Settings, never hardcoded

---

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env — set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME, SECRET_KEY, JWT_SECRET_KEY
```

### Create the MySQL database

```sql
CREATE DATABASE rental_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rental_user'@'localhost' IDENTIFIED BY 'change-this-db-password';
GRANT ALL PRIVILEGES ON rental_saas.* TO 'rental_user'@'localhost';
FLUSH PRIVILEGES;
```

Then create the tables — either via the pre-generated schema, or via migrations:

```bash
# Option A — quick start
mysql -u rental_user -p rental_saas < schema.sql

# Option B — proper migrations (recommended if you'll evolve the schema)
export FLASK_APP=run.py
flask db init
flask db migrate -m "initial schema"
flask db upgrade
```

### Seed subscription plans + the default Super Admin

```bash
flask seed
# creates Starter/Standard/Premium plans and:
#   admin@rentalos.app / Admin@12345
# CHANGE THIS PASSWORD IMMEDIATELY after first login.
```

### Run the API

```bash
python run.py          # dev server on http://localhost:5000
# production: gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Daily reminder job (rent due / overdue / agreement expiry)

Add a cron entry (or systemd timer) to run once a day:

```bash
cd backend && source venv/bin/activate && flask run-reminders
```

This sends "rent due" reminders, marks invoices overdue (applying any
configured late fee), and flags agreements expiring within 30 days —
via whichever channels each owner has enabled in Owner ▸ Reminder Settings.

---

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173, proxies /api to :5000
```

Production build:
```bash
npm run build            # outputs to frontend/dist — serve with any static host / nginx
```

---

## 3. First-time configuration (as Super Admin)

1. Log in at `/login` with `admin@rentalos.app` / `Admin@12345`, change the password.
2. Go to **Integration Settings** and add:
   - **Twilio** Account SID + Auth Token + SMS From number (for password resets & SMS reminders)
   - **WhatsApp** From number (Twilio WhatsApp sandbox or approved sender) — powers rent reminders, maintenance updates, messages
   - **Telegram** Bot Token (create via [@BotFather](https://t.me/BotFather)) — owners/tenants link their chat to receive alerts
   - **Razorpay** Key ID + Key Secret — powers the tenant "Pay Now" button
3. Review/edit **Subscription Plans** (Starter/Standard/Premium ship pre-seeded, matching the original pricing).
4. Owners can now self-register at `/register`, or you can create them and set their plan from **Owners**.

Every credential above is stored in the `app_settings` table (not `.env`), so
they can be rotated at any time without a redeploy.

---

## 4. What's included vs. the original app

Everything from the original owner/tenant screens — property & room
management, tenant profiles, room assignments, agreements, invoices &
payments, reports, subscription plans — **plus**:

| Gap identified | What was added |
|---|---|
| No forgot-password flow | Full forgot/reset password (SMS delivery) |
| No owner notifications | Owners get in-app + WhatsApp/SMS/Telegram alerts too |
| No owner↔tenant messaging | Threaded messages, both directions |
| No maintenance ticketing | Tenant raises tickets → owner tracks status (open → in progress → resolved → closed) |
| No tenant vacate flow | Tenant submits notice → owner approves/rejects |
| No online payments | Razorpay "Pay Now" on tenant invoices, verified server-side |
| No e-signature | Tenant types their legal name to sign an agreement |
| No document repository | `documents` table + endpoints for ID proofs, police verification, etc. |
| No lease renewal workflow | Owner proposes a renewal (new rent/dates) → tenant accepts/declines |
| No late fees | Owner-configurable flat/% late fee, auto-applied on the overdue sweep |
| No CSV export | Reports ▸ Export CSV |
| No multi-property dashboard tier gating | Enforced via `SubscriptionPlan.room_limit` / `multi_property` |
| No visitor log, meter readings, inspections | Added as tenant-facing endpoints/models, ready to wire into UI as needed |

## 5. Project structure

```
backend/
  app/
    models.py              # every table
    blueprints/{auth,owner,tenant,admin,common}/routes.py
    services/               # twilio, telegram, razorpay, notifications, settings
    utils/                  # decorators, pdf generation
  schema.sql                # generated MySQL DDL
  requirements.txt / .env.example / run.py / config.py

frontend/
  src/
    pages/{auth,owner,tenant,admin}/
    components/             # DashboardShell, layouts, shared UI primitives
    api/client.js           # axios + JWT auto-refresh
    context/AuthContext.jsx
  tailwind.config.js         # gradient design tokens
```
