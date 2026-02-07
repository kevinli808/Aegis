from datetime import datetime
from bson import ObjectId

class IncidentManager:
    def __init__(self, db):
        self.collection = db.incidents

    def create_report(self, report_data, score_results):
        """
        Saves a new report with its calculated priority.
        """
        document = {
            "status": "active",
            "created_at": datetime.utcnow(),
            "location": {
                "type": "Point",
                "coordinates": [report_data['lon'], report_data['lat']]
            },
            "details": {
                "incident_type": report_data['type'],
                "symptoms": report_data['symptoms'],
                "num_people": report_data['num_people']
            },
            "priority": score_results['priority'],
            "score_metrics": score_results['components'],
            "final_score": score_results['score']
        }
        result = self.collection.insert_one(document)
        return str(result.inserted_id)

    def get_nearby_incidents(self, lon, lat, radius_meters=500):
        """
        Fetches nearby reports to check for duplicates (Logic 3.6).
        """
        query = {
            "location": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "$maxDistance": radius_meters
                }
            },
            "status": "active"
        }
        return list(self.collection.find(query))

    def update_status(self, incident_id, new_status):
        """Updates status: 'dispatched', 'resolved', etc."""
        self.collection.update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
        )