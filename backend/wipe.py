from database import get_db

db = get_db()
result = db.incidents.delete_many({})
print(f"Cleared {result.deleted_count} old test reports. Ready for demo!")