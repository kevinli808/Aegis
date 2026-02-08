# Aegis
A disaster response program useful for a post-disaster. Made for Hack the Coast 2026

## Stack
* **Frontend**: React + TypeScript + Vite
* **Backend**: FastAPI + MongoDB
* **AI Voice**: ElevenLabs Conversational AI
* **Hosting**: Vultr (frontend & backend)

## Local Setup

### Frontend
```bash
cd frontend && npm install && npm run dev
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
VITE_ELEVENLABS_AGENT_ID=your-agent-id
```

### Backend
See [Quick Start](#-quick-start) below.

## ElevenLabs Voice Call

Visit `/call` or use **Voice Call** from the "Need Help?" flow to speak with an AI agent. The agent collects your situation and location for responders.

**Setup:**
1. Create an agent at [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Copy the agent ID and add to `frontend/.env`:
   ```
   VITE_ELEVENLABS_AGENT_ID=agent_xxxxxxxx
   ```

The call log shows the full conversation transcript and persists after the call ends.

## Vultr Production

Frontend and backend are hosted on Vultr. Configure the frontend to point at your API:

```
VITE_API_URL=http://YOUR_VULTR_IP/api
```

Replace `YOUR_VULTR_IP` with your server IP (e.g. `149.28.10.116`).

# 🛡️ Aegis Backend

The central nervous system for the Aegis emergency response platform. This FastAPI-powered backend handles real-time incident ingestion, runs a weighted priority scoring algorithm, and serves as the data bridge between the frontend and MongoDB.


## 🚀 Quick Start

### 1. Prerequisites
* Python 3.9+
* MongoDB Atlas account (or a local MongoDB instance)

### 2. Installation
```bash
# Clone the repository
git clone [https://github.com/kevinli808/Aegis.git](https://github.com/kevinli808/Aegis.git)
cd Aegis

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```
### 3. Environment Setup

Create a .env file in the root directory and add your MongoDB connection string:

`MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aegis`

### 4. Run the server
```bash
uvicorn main:app --reload
```

## 🛠️ API Architecture
**Priority Scoring Algorithm**
Every report sent to `/report` is processed through our scoring engine. It assigns a **Priority Level (1-3)** based on:
* **Incident Type**: Medical, Fire, and Trapped (High) vs. Power Outage (Low).
* **Scale**: Number of people affected.
* **Status**: Immediate danger or life-threatening symptoms (Unconscious, Breathing Difficulty).

**Key Endpoints**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/report` | Ingests new data and runs the scoring algorithm |
| `GET` | `/incidents/stats` | Returns active incidents. Use `?map_view=true` for map markers. |
| `GET` | `/incidents` | Returns active incidents by priority level. |
| `PATCH` | `/incidents/{incident_id}/resolve` | Updates an incident status from "active" to "resolved" |
| `GET` | `/incidents/{incident_id}` | Returns incident details by incident ID. |

## 📁 Project Structure
* `main.py`: Application entry point, CORS settings, and route definitions.
* `database.py`: MongoDB connection and client setup.
* `crud.py`: Database helper functions for creating and updating incidents.
* `seed_data.py`: Script to populate the database with mock Vancouver-based incidents.
* `wipe.py`: Script to clean all incident data in the MongoDB.