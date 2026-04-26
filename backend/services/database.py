"""
MongoDB database operations.
Handles storing and retrieving messages, feedback, users, and auth sessions.
"""

import os
from datetime import datetime
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.collection import ReturnDocument
from pymongo.errors import ConnectionFailure
import logging

logger = logging.getLogger(__name__)


class Database:
    """MongoDB database handler."""

    def __init__(self, uri: str = None, db_name: str = None):
        """
        Initialize database connection.

        Args:
            uri: MongoDB connection string (from env or default)
            db_name: Database name
        """
        default_uri = None if os.getenv('VERCEL') else 'mongodb://localhost:27017'
        self.uri = uri or os.getenv('MONGODB_URI', default_uri)
        self.db_name = db_name or os.getenv('MONGODB_DB', 'fake_news_detection')
        self.client: Optional[MongoClient] = None
        self.db = None
        self.messages_collection = None
        self.feedback_collection = None
        self.users_collection = None
        self.auth_sessions_collection = None

    def connect(self) -> bool:
        """Establish connection to MongoDB."""
        if not self.uri:
            logger.info("ℹ️ No MongoDB URI configured; skipping database connection")
            return False

        try:
            timeout_ms = int(os.getenv('MONGODB_TIMEOUT_MS', '1000'))
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=timeout_ms)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            self.messages_collection = self.db['messages']
            self.feedback_collection = self.db['feedback']
            self.users_collection = self.db['users']
            self.auth_sessions_collection = self.db['auth_sessions']
            logger.info(f"✅ Connected to MongoDB: {self.uri}, database: {self.db_name}")
            return True
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {e}")
            return False

    def save_message(self, data: Dict[str, Any]) -> Optional[str]:
        """
        Save analysis result to messages collection.

        Args:
            data: Dictionary containing message analysis data

        Returns:
            Inserted document ID as string, or None on failure
        """
        if self.messages_collection is None:
            logger.warning("⚠️ MongoDB messages collection unavailable; skipping message persistence")
            return None

        try:
            # Ensure timestamp exists
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow()

            result = self.messages_collection.insert_one(data)
            logger.info(f"💾 Saved message to DB: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Failed to save message: {e}")
            return None

    def save_feedback(self, data: Dict[str, Any]) -> Optional[str]:
        """
        Save user feedback to feedback collection.

        Args:
            data: Dictionary with message_text, predicted_label, user_label

        Returns:
            Inserted document ID as string, or None on failure
        """
        if self.feedback_collection is None:
            logger.warning("⚠️ MongoDB feedback collection unavailable; skipping feedback persistence")
            return None

        try:
            data['timestamp'] = datetime.utcnow()
            result = self.feedback_collection.insert_one(data)
            logger.info(f"💾 Saved feedback to DB: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Failed to save feedback: {e}")
            return None

    def upsert_user_account(self, data: Dict[str, Any]) -> Optional[str]:
        """
        Create or update a user account using provider identity.

        Args:
            data: Dictionary containing provider, provider_user_id, email, name, picture

        Returns:
            User document ID as string, or None on failure
        """
        if self.users_collection is None:
            logger.warning("⚠️ MongoDB users collection unavailable; skipping user persistence")
            return None

        try:
            now = datetime.utcnow()
            provider = data.get('provider', 'google')
            provider_user_id = data.get('provider_user_id')
            if not provider_user_id:
                logger.warning("⚠️ Missing provider_user_id; cannot persist user account")
                return None

            update = {
                "$set": {
                    'email': data.get('email'),
                    'name': data.get('name'),
                    'picture': data.get('picture'),
                    'verified_email': data.get('verified_email', False),
                    'session_id': data.get('session_id'),
                    'last_login_at': now,
                    'updated_at': now
                },
                "$setOnInsert": {
                    'provider': provider,
                    'provider_user_id': provider_user_id,
                    'created_at': now
                }
            }
            result = self.users_collection.find_one_and_update(
                {'provider': provider, 'provider_user_id': provider_user_id},
                update,
                upsert=True,
                return_document=ReturnDocument.AFTER
            )
            if result:
                return str(result.get('_id'))

            inserted = self.users_collection.find_one({'provider': provider, 'provider_user_id': provider_user_id})
            return str(inserted.get('_id')) if inserted else None
        except Exception as e:
            logger.error(f"❌ Failed to upsert user account: {e}")
            return None

    def save_auth_session(self, data: Dict[str, Any]) -> Optional[str]:
        """Create or update an auth session record."""
        if self.auth_sessions_collection is None:
            logger.warning("⚠️ MongoDB auth sessions collection unavailable; skipping auth session persistence")
            return None

        try:
            now = datetime.utcnow()
            session_id = data.get('session_id')
            if not session_id:
                logger.warning("⚠️ Missing session_id; cannot persist auth session")
                return None

            self.auth_sessions_collection.update_one(
                {'session_id': session_id},
                {
                    "$set": {
                        'user_id': data.get('user_id'),
                        'email': data.get('email'),
                        'provider': data.get('provider', 'google'),
                        'last_seen_at': now,
                        'active': True
                    },
                    "$setOnInsert": {
                        'created_at': now
                    }
                },
                upsert=True
            )
            return session_id
        except Exception as e:
            logger.error(f"❌ Failed to save auth session: {e}")
            return None

    def get_user_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Look up a user from a stored auth session."""
        if self.auth_sessions_collection is None or self.users_collection is None:
            logger.warning("⚠️ MongoDB auth session lookup unavailable")
            return None

        try:
            session = self.auth_sessions_collection.find_one({'session_id': session_id, 'active': True})
            if not session:
                return None

            user_id = session.get('user_id')
            email = session.get('email')
            user = None

            if user_id:
                from bson import ObjectId
                user = self.users_collection.find_one({"_id": ObjectId(user_id)})

            if user is None and email:
                user = self.users_collection.find_one({'email': email})

            return user
        except Exception as e:
            logger.error(f"❌ Failed to get user by session {session_id}: {e}")
            return None

    def deactivate_auth_session(self, session_id: str) -> bool:
        """Mark an auth session inactive."""
        if self.auth_sessions_collection is None:
            logger.warning("⚠️ MongoDB auth sessions collection unavailable; cannot deactivate session")
            return False

        try:
            self.auth_sessions_collection.update_one(
                {'session_id': session_id},
                {"$set": {'active': False, 'last_seen_at': datetime.utcnow()}}
            )
            return True
        except Exception as e:
            logger.error(f"❌ Failed to deactivate auth session {session_id}: {e}")
            return False

    def get_message_by_id(self, message_id: str) -> Optional[Dict]:
        """Retrieve a message by its ID."""
        if self.messages_collection is None:
            logger.warning("⚠️ MongoDB messages collection unavailable; cannot fetch message")
            return None

        try:
            from bson import ObjectId
            return self.messages_collection.find_one({"_id": ObjectId(message_id)})
        except Exception as e:
            logger.error(f"❌ Failed to get message {message_id}: {e}")
            return None

    def get_feedback_stats(self) -> Dict[str, Any]:
        """Get basic statistics about feedback."""
        if self.feedback_collection is None:
            logger.warning("⚠️ MongoDB feedback collection unavailable; no feedback stats")
            return {}

        try:
            total = self.feedback_collection.count_documents({})
            pipeline = [
                {"$group": {
                    "_id": "$predicted_label",
                    "count": {"$sum": 1}
                }}
            ]
            counts = list(self.feedback_collection.aggregate(pipeline))
            return {
                "total_feedback": total,
                "by_prediction": {item['_id']: item['count'] for item in counts}
            }
        except Exception as e:
            logger.error(f"❌ Failed to get feedback stats: {e}")
            return {}

    def close(self):
        """Close database connection."""
        if self.client:
            self.client.close()
            logger.info("🔒 MongoDB connection closed")


# Global database instance (will be initialized in main.py)
db = Database()


def get_database() -> Database:
    """Get the global database instance."""
    return db
