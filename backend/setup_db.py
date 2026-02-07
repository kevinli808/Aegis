# setup_db.py
from database import get_db
from pymongo import GEOSPHERE

from pymongo import MongoClient, GEOSPHERE

def setup_indexes(db):
    # This enables the $near queries for duplicate detection
    db.incidents.create_index([("location", GEOSPHERE)])
    print("Geospatial index created.")

if __name__ == "__main__":
    setup_indexes()