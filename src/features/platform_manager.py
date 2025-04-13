import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import hashlib
from .user_pages import UserPage
from .bitcoin_tracker import BitcoinTracker

class PlatformManager:
    def __init__(self):
        self.platform_dir = "platform_data"
        self.users_file = os.path.join(self.platform_dir, "users.json")
        self._ensure_directories()
        self.load_data()
        
    def _ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(self.platform_dir, exist_ok=True)
        
    def load_data(self):
        """Load platform data from file"""
        try:
            with open(self.users_file, 'r') as f:
                self.data = json.load(f)
        except FileNotFoundError:
            self.data = {
                "users": {},
                "platform_stats": {
                    "total_users": 0,
                    "total_donations": 0,
                    "active_users": 0,
                    "total_projects": 0
                },
                "rewards": {
                    "referral_bonus": 0.0001,  # BTC
                    "activity_bonus": 0.00005,  # BTC
                    "project_bonus": 0.0001    # BTC
                }
            }
            self.save_data()
            
    def save_data(self):
        """Save platform data to file"""
        with open(self.users_file, 'w') as f:
            json.dump(self.data, f, indent=2)
            
    def register_user(self, 
                     username: str,
                     referrer: Optional[str] = None) -> Dict:
        """Register a new user"""
        if username in self.data["users"]:
            raise ValueError("Username already exists")
            
        # Create user page
        user_page = UserPage(username)
        
        # Initialize user data
        user_data = {
            "username": username,
            "registered_at": datetime.now().isoformat(),
            "referrer": referrer,
            "wallet": {
                "balance": 0.0,
                "transactions": [],
                "rewards": []
            },
            "stats": {
                "projects_created": 0,
                "donations_received": 0,
                "referrals": 0,
                "activity_score": 0
            }
        }
        
        # Add to platform data
        self.data["users"][username] = user_data
        self.data["platform_stats"]["total_users"] += 1
        
        # Handle referral bonus
        if referrer and referrer in self.data["users"]:
            self._add_referral_bonus(referrer, username)
            
        self.save_data()
        return user_data
        
    def _add_referral_bonus(self, referrer: str, new_user: str):
        """Add referral bonus to referrer"""
        bonus = self.data["rewards"]["referral_bonus"]
        
        # Add to referrer's wallet
        self.data["users"][referrer]["wallet"]["balance"] += bonus
        self.data["users"][referrer]["wallet"]["rewards"].append({
            "type": "referral",
            "amount": bonus,
            "new_user": new_user,
            "timestamp": datetime.now().isoformat()
        })
        self.data["users"][referrer]["stats"]["referrals"] += 1
        
        # Add to new user's wallet
        self.data["users"][new_user]["wallet"]["balance"] += bonus
        self.data["users"][new_user]["wallet"]["rewards"].append({
            "type": "welcome",
            "amount": bonus,
            "referrer": referrer,
            "timestamp": datetime.now().isoformat()
        })
        
    def add_activity_bonus(self, username: str, activity_type: str):
        """Add activity bonus to user"""
        if username not in self.data["users"]:
            raise ValueError("User not found")
            
        bonus = self.data["rewards"]["activity_bonus"]
        
        self.data["users"][username]["wallet"]["balance"] += bonus
        self.data["users"][username]["wallet"]["rewards"].append({
            "type": "activity",
            "activity_type": activity_type,
            "amount": bonus,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update activity score
        self.data["users"][username]["stats"]["activity_score"] += 1
        self.save_data()
        
    def add_project_bonus(self, username: str, project_name: str):
        """Add project bonus to user"""
        if username not in self.data["users"]:
            raise ValueError("User not found")
            
        bonus = self.data["rewards"]["project_bonus"]
        
        self.data["users"][username]["wallet"]["balance"] += bonus
        self.data["users"][username]["wallet"]["rewards"].append({
            "type": "project",
            "project_name": project_name,
            "amount": bonus,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update project stats
        self.data["users"][username]["stats"]["projects_created"] += 1
        self.data["platform_stats"]["total_projects"] += 1
        self.save_data()
        
    def get_user_stats(self, username: str) -> Dict:
        """Get user statistics"""
        if username not in self.data["users"]:
            raise ValueError("User not found")
            
        return {
            "user_data": self.data["users"][username],
            "platform_stats": self.data["platform_stats"],
            "rewards": self.data["rewards"]
        }
        
    def get_leaderboard(self, metric: str = "activity_score") -> List[Dict]:
        """Get leaderboard based on metric"""
        if metric not in ["activity_score", "projects_created", "donations_received", "referrals"]:
            raise ValueError("Invalid metric")
            
        leaderboard = []
        for username, data in self.data["users"].items():
            leaderboard.append({
                "username": username,
                "score": data["stats"][metric],
                "wallet_balance": data["wallet"]["balance"]
            })
            
        leaderboard.sort(key=lambda x: x["score"], reverse=True)
        return leaderboard
        
    def generate_platform_report(self) -> Dict:
        """Generate platform-wide report"""
        return {
            "platform_stats": self.data["platform_stats"],
            "top_users": self.get_leaderboard()[:10],
            "recent_activity": self._get_recent_activity(),
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat()
            }
        }
        
    def _get_recent_activity(self) -> List[Dict]:
        """Get recent platform activity"""
        activity = []
        for username, data in self.data["users"].items():
            for reward in data["wallet"]["rewards"][-5:]:  # Last 5 rewards
                activity.append({
                    "username": username,
                    "type": reward["type"],
                    "amount": reward["amount"],
                    "timestamp": reward["timestamp"]
                })
                
        activity.sort(key=lambda x: x["timestamp"], reverse=True)
        return activity[:50]  # Return last 50 activities 