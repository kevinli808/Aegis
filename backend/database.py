from pymongo import MongoClient
import os

# Replace with your actual string or use an environment variable (recommended)
MONGO_URI = "mongodb+srv://henryshi293:Ssy050403!@aegis.6ugpq7z.mongodb.net/?appName=Aegis"

def get_db():
    client = MongoClient(MONGO_URI)
    # This automatically creates the DB if it doesn't exist
    return client['hackathon_db']

# Quick test
if __name__ == "__main__":
    db = get_db()
    print("Connected to:", db.name)