# Multi-Tenant SaaS Feature Flag Management System (PoC)

A full-stack, multi-tenant Feature Flag Management System designed for SaaS platforms as a Proof of Concept (PoC). This system demonstrates secure tenant isolation, scoped administration, and end-user toggle capabilities through three sleek dark-mode React consoles.

---

## Tech Stack

### Backend

- **Core**: Node.js & Express
- **Database**: MongoDB & Mongoose
- **Security & Auth**: JSON Web Tokens (JWT) & Crypto-JS (SHA-256 password hashing)
- **API Structure**: Express Routers (`/super-admin`, `/org-admin`, `/user`)

### Frontend (Client Apps)

- **Framework**: React 19 & Vite
- **Styling**: Tailwind CSS v4 & custom glassmorphism components
- **Icons**: Lucide React

---

## PoC Architecture & Roles

The PoC comprises three scoped dashboards working together:

1. **Super Admin Portal **: Creates tenant organizations and lists them in a paginated, searchable index.
2. **Organization Admin Console**: Enforces single-admin-per-organization signup. Allows CRUD management (create, search, edit key inline, toggle status, delete) of flags scoped strictly to their organization.
3. **End User Console**: Registers/Logs in under an organization, loads flags, and allows users to check selection boxes and click **Submit** to toggle a flag's status globally for their tenant organization.

---

## Quick Start Setup

### Prerequisites

- Node.js (v18+)
- MongoDB running locally (typically `mongodb://127.0.0.1:27017`)

### 1. Run the Backend API Server

1. Navigate to the `SERVER` directory:
   ```bash
   cd SERVER
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env-example` template to a new `.env` file and configure your values:
   ```bash
   cp .env-example .env
   ```
4. Start the server :
   ```bash
   npm run dev
   ```

### 2. Run the React Consoles

In three separate terminal windows, run the following:

- **Super Admin Console** :
  ```bash
  cd CLIENT/SUPER_ADMIN
  npm install
  npm run dev
  ```
- **Organization Admin Console** :
  ```bash
  cd CLIENT/ORG_ADMIN
  npm install
  npm run dev
  ```
- **End User Console** :
  ```bash
  cd CLIENT/END_USER
  npm install
  npm run dev
  ```

---

## Step-by-Step PoC Scenario

Follow this flow to verify the end-to-end integration:

1. **Create Tenant Organization**:
   - Open the **Super Admin Console**
   - Login with: **Email**: `admin@email.com` | **Password**: `adminpassword123`.
   - Create an organization (e.g. `Hooli`). It will appear in the directory below.
2. **Create Organization Flag**:
   - Open the **Org Admin Console**.
   - Go to **Sign up** and register under Organization Name `Hooli`.
   - Login, fill the form to create a flag named `ENABLE_BETA_UI`, and keep it unchecked (disabled).
3. **Toggle Global Flag as End User**:
   - Open the **End User Console**.
   - Go to **Sign up** and register a user under Organization Name `Hooli`.
   - Login to see the feature flags scoped to your organization.
   - Check the checkbox next to `ENABLE_BETA_UI` and click the **Submit** button at the top.
   - Confirm the system responds with a success message confirming the state has been successfully updated.
