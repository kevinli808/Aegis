import requests
import random

BASE_URL = "http://127.0.0.1:8000/report"

# Center of Vancouver coordinates
VAN_LAT = 49.2827
VAN_LON = -123.1207

incident_types = ["medical", "fire", "flood", "power_outage", "trapped"]
symptoms_list = ["unconscious", "breathing_difficulty", "bleeding", "none"]
safety_statuses = ["safe", "stable", "trapped", "danger"]

def generate_data():
    for i in range(10):
        # Generate slight variations around Vancouver
        lat = VAN_LAT + random.uniform(-0.05, 0.05)
        lon = VAN_LON + random.uniform(-0.05, 0.05)
        
        payload = {
            "type": random.choice(incident_types),
            "num_people": random.randint(1, 10),
            "symptoms": [random.choice(symptoms_list)],
            "safety_status": random.choice(safety_statuses),
            "immediate_danger": random.choice([True, False]),
            "location": {
                "type": "Point",
                "coordinates": [lon, lat]  # Longitude first for GeoJSON
            }
        }
        
        response = requests.post(BASE_URL, json=payload)
        print(f"Report {i+1}: Status {response.status_code} - Priority {response.json().get('priority')}")

if __name__ == "__main__":
    generate_data()