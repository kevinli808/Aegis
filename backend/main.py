from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from crud import IncidentManager
from gemini_service import get_chat_response
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List
import bson
import math



app = FastAPI()
db = get_db()
manager = IncidentManager(db)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_scoring_logic(data):
    """
    Analyzes incident data to produce a priority level (1-3) and a final score.
    Higher scores = Higher Priority.
    """
    score = 0
    
    # 1. Base Score by Incident Type
    # High-risk types get a head start
    type_weights = {
        "medical": 40,
        "fire": 45,
        "trapped": 50,
        "flood": 30,
        "power_outage": 10
    }
    incident_type = data.get("type", "unknown")
    score += type_weights.get(incident_type, 5)

    # 2. People Affected
    # Every person adds to the urgency (scaled by 5 per person)
    num_people = data.get("num_people", 1)
    score += (num_people * 5)

    # 3. Symptoms Severity
    # We loop through symptoms to add points for critical conditions
    symptoms = data.get("symptoms", [])
    if "unconscious" in symptoms:
        score += 50
    if "breathing_difficulty" in symptoms:
        score += 40
    if "bleeding" in symptoms:
        score += 30

    # 4. Safety Status
    # Being in danger or trapped is a major score multiplier
    safety = data.get("safety_status", "stable")
    if safety == "danger":
        score += 60
    elif safety == "trapped":
        score += 50

    # 5. Immediate Danger Flag
    # A simple boolean override for high urgency
    if data.get("immediate_danger") is True:
        score += 100

    # --- PRIORITY ASSIGNMENT ---
    # We categorize the score into Priority 1, 2, or 3
    if score >= 120:
        priority = 1
    elif score >= 60:
        priority = 2
    else:
        priority = 3

    return {
        "score": score,
        "priority": priority
    }


# --- ROUTES ---
class IncidentReport(BaseModel):
    # Core fields for scoring
    type: str = "emergency"
    num_people: int = 1
    symptoms: List[str] = []
    safety_status: str = "stable"
    location: dict
    # RespondeeForm fields (optional)
    name: str = ""
    phone: str = ""
    situation: str = ""
    city: str = ""
    province: str = ""
    postalCode: str = ""
    medicalConditions: str = ""
    immediacy: str = "moderate"
    isChild: bool = False
    hasMobilityLimitations: bool = False
    environmentalHazards: str = ""
    numberOfPeople: str = "1"

@app.get("/")
async def heartbeat():
    return {"status": "online", "message": "Aegis Backend is running"}

@app.post("/report")
async def create_report(report: IncidentReport):
    data = report.model_dump()
    # Form sends situation in "type" field - normalize
    if data.get("type") and len(str(data["type"])) > 20 and not data.get("situation"):
        data["situation"] = data["type"]
    elif data.get("type") and data["type"] not in ("medical", "fire", "flood", "trapped", "power_outage", "emergency"):
        data["situation"] = data.get("situation") or data["type"]
    # Map RespondeeForm immediacy to safety_status for scoring
    immediacy = data.get("immediacy", "moderate")
    if immediacy in ("critical", "high"):
        data["safety_status"] = "danger"
    elif immediacy == "low":
        data["safety_status"] = "stable"
    else:
        data["safety_status"] = "stable"
    # Infer type from situation for scoring
    situation = (data.get("situation") or data.get("type") or "").lower()
    if "medical" in situation or "injured" in situation or "bleeding" in situation:
        data["type"] = "medical"
    elif "fire" in situation or "smoke" in situation:
        data["type"] = "fire"
    elif "flood" in situation or "water" in situation:
        data["type"] = "flood"
    elif "trapped" in situation or "stuck" in situation:
        data["type"] = "trapped"
    elif data.get("type") not in ("medical", "fire", "flood", "trapped", "power_outage"):
        data["type"] = "medical"
    if data.get("medicalConditions"):
        data["symptoms"] = list(set(list(data.get("symptoms", [])) + [data["medicalConditions"]]))
    data["num_people"] = int(data.get("numberOfPeople", 1) or 1) if isinstance(data.get("numberOfPeople"), str) else (data.get("num_people") or 1)
    data["immediate_danger"] = data.get("immediacy") == "critical"
    # Run scoring
    scoring_results = run_scoring_logic(data)
    full_report = {
        **data,
        **scoring_results,
        "status": "pending",
        "timestamp": datetime.now()
    }
    result = db.incidents.insert_one(full_report)
    
    return {
        "status": "success", 
        "id": str(result.inserted_id), 
        "priority": scoring_results["priority"]
    }

@app.get("/incidents/stats")
async def get_stats():
    """
    Dashboard route: must stay above the generic /incidents route.
    """
    active_count = db.incidents.count_documents({"status": {"$ne": "resolved"}})
    pipeline = [
        {"$match": {"status": {"$ne": "resolved"}}},
        {"$group": {"_id": None, "total_people": {"$sum": "$num_people"}}}
    ]
    stats = list(db.incidents.aggregate(pipeline))
    total_people = stats[0]["total_people"] if stats else 0
    
    return {
        "active_incidents": active_count,
        "people_affected": total_people
    }

@app.get("/incidents")
async def get_incidents_by_priority(priority: int = None, map_view: bool = False):
    """
    The 'All-in-One' route. 
    Use ?map_view=true for lightweight map data.
    Use ?priority=1 to filter.
    """
    query = {"status": {"$ne": "resolved"}}
    if priority:
        query["priority"] = priority

    cursor = db.incidents.find(query).sort("score", -1)
    results = []

    for doc in cursor:
        if map_view:
            results.append({
                "id": str(doc["_id"]),
                "lat": doc["location"]["coordinates"][1],
                "lon": doc["location"]["coordinates"][0],
                "priority": doc.get("priority"),
                "type": doc.get("type")
            })
        else:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
    return results

@app.patch("/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str):
    """Updates status to resolved."""
    if not bson.objectid.ObjectId.is_valid(incident_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = db.incidents.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": "resolved"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident resolved"}


class StatusUpdate(BaseModel):
    status: str


@app.patch("/incidents/{incident_id}/status")
async def update_incident_status(incident_id: str, body: StatusUpdate):
    """Updates incident status (pending, in-progress, resolved)."""
    if not bson.objectid.ObjectId.is_valid(incident_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = db.incidents.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": body.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Status updated", "status": body.status}

@app.get("/incidents/{incident_id}")
async def get_incident_detail(incident_id: str):
    """
    Catch-all detail route (Keep at the bottom).
    """
    if not bson.objectid.ObjectId.is_valid(incident_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    doc = db.incidents.find_one({"_id": ObjectId(incident_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    
    doc["_id"] = str(doc["_id"])
    return doc

@app.post("/chat/gemini")
async def chat_with_gemini(request: Request):
    """
    Chat endpoint that communicates with Gemini API.
    Expects: {
        "user_message": str,
        "conversation_history": list,
        "form_data": dict (optional, for first message context),
        "is_first_message": bool (optional, default False)
    }
    """
    try:
        payload = await request.json()
        user_message = payload.get("user_message")
        conversation_history = payload.get("conversation_history", [])
        form_data = payload.get("form_data")
        is_first_message = payload.get("is_first_message", False)
        
        if not user_message:
            raise HTTPException(status_code=400, detail="user_message is required")
        
        response = await get_chat_response(
            conversation_history=conversation_history,
            user_message=user_message,
            form_data=form_data,
            is_first_message=is_first_message
        )
        
        return {"response": response}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# @app.get("/incidents/map/coordinates")
# async def get_map_points():
#     """
#     Returns a lightweight list of coordinates and priorities for map plotting.
#     """
#     cursor = db.incidents.find({"status": "active"}, {"location": 1, "priority": 1, "type": 1})
    
#     features = []
#     for doc in cursor:
#         features.append({
#             "id": str(doc["_id"]),
#             "lon": doc["location"]["coordinates"][0],
#             "lat": doc["location"]["coordinates"][1],
#             "priority": doc.get("priority", 3),
#             "type": doc.get("type", "unknown")
#         })
#     return features

# @app.get("/incidents/all")
# async def get_all_incidents():
#     """Returns everything in the database, highest score first."""
#     # We sort by -1 to get Descending order (highest score first)
#     incidents = list(db.incidents.find().sort("final_score", -1))
#     for inc in incidents:
#         inc["_id"] = str(inc["_id"])
#     return incidents

# @app.get("/incidents/feed")
# async def get_incident_feed():
#     # Only show incidents that haven't been resolved yet
#     query = {"status": {"$ne": "resolved"}} 
#     incidents = list(db.incidents.find(query).sort("final_score", -1))
    
#     for inc in incidents:
#         inc["_id"] = str(inc["_id"])
#     return incidents

# @app.get("/incidents/priority/{level}")
# async def get_by_priority(level: int):
#     # Quick filter for the dashboard
#     incidents = list(db.incidents.find({"priority": level}).limit(20))
#     for inc in incidents:
#         inc["_id"] = str(inc["_id"]) # Convert ObjectId to string for JSON
#     return incidents


