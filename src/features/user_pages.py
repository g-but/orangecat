import json
from datetime import datetime
from typing import Dict, List, Optional
import os

class UserPage:
    def __init__(self, username: str):
        self.username = username
        self.pages_dir = "user_pages"
        self.user_file = os.path.join(self.pages_dir, f"{username}.json")
        self._ensure_directories()
        self.load_data()
        
    def _ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(self.pages_dir, exist_ok=True)
        
    def load_data(self):
        """Load user data from file"""
        try:
            with open(self.user_file, 'r') as f:
                self.data = json.load(f)
        except FileNotFoundError:
            self.data = {
                "username": self.username,
                "created_at": datetime.now().isoformat(),
                "bitcoin_address": None,
                "activity_status": {
                    "is_online": False,
                    "last_online": None,
                    "current_project": None,
                    "streaming": False
                },
                "blog_posts": [],
                "projects": [],
                "donations": {
                    "total_received": 0,
                    "transactions": []
                }
            }
            self.save_data()
            
    def save_data(self):
        """Save user data to file"""
        with open(self.user_file, 'w') as f:
            json.dump(self.data, f, indent=2)
            
    def set_bitcoin_address(self, address: str):
        """Set Bitcoin donation address"""
        self.data["bitcoin_address"] = address
        self.save_data()
        
    def update_activity_status(self, 
                             is_online: bool,
                             current_project: Optional[str] = None,
                             streaming: bool = False):
        """Update user's activity status"""
        self.data["activity_status"].update({
            "is_online": is_online,
            "last_online": datetime.now().isoformat() if is_online else self.data["activity_status"]["last_online"],
            "current_project": current_project,
            "streaming": streaming
        })
        self.save_data()
        
    def add_blog_post(self, 
                     title: str,
                     content: str,
                     tags: Optional[List[str]] = None):
        """Add a new blog post"""
        post = {
            "id": len(self.data["blog_posts"]) + 1,
            "title": title,
            "content": content,
            "tags": tags or [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        self.data["blog_posts"].append(post)
        self.save_data()
        return post
        
    def update_blog_post(self, 
                        post_id: int,
                        title: Optional[str] = None,
                        content: Optional[str] = None,
                        tags: Optional[List[str]] = None):
        """Update an existing blog post"""
        for post in self.data["blog_posts"]:
            if post["id"] == post_id:
                if title:
                    post["title"] = title
                if content:
                    post["content"] = content
                if tags:
                    post["tags"] = tags
                post["updated_at"] = datetime.now().isoformat()
                self.save_data()
                return post
        return None
        
    def add_project(self, 
                   name: str,
                   description: str,
                   bitcoin_address: Optional[str] = None,
                   status: str = "active"):
        """Add a new project"""
        project = {
            "id": len(self.data["projects"]) + 1,
            "name": name,
            "description": description,
            "bitcoin_address": bitcoin_address or self.data["bitcoin_address"],
            "status": status,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        self.data["projects"].append(project)
        self.save_data()
        return project
        
    def add_donation(self, 
                    amount: float,
                    project_id: Optional[int] = None,
                    message: Optional[str] = None):
        """Add a donation transaction"""
        transaction = {
            "timestamp": datetime.now().isoformat(),
            "amount": amount,
            "project_id": project_id,
            "message": message
        }
        self.data["donations"]["transactions"].append(transaction)
        self.data["donations"]["total_received"] += amount
        self.save_data()
        return transaction
        
    def get_activity_feed(self) -> List[Dict]:
        """Get user's activity feed"""
        feed = []
        
        # Add blog posts
        for post in self.data["blog_posts"]:
            feed.append({
                "type": "blog_post",
                "timestamp": post["created_at"],
                "data": post
            })
            
        # Add project updates
        for project in self.data["projects"]:
            feed.append({
                "type": "project",
                "timestamp": project["created_at"],
                "data": project
            })
            
        # Add donations
        for donation in self.data["donations"]["transactions"]:
            feed.append({
                "type": "donation",
                "timestamp": donation["timestamp"],
                "data": donation
            })
            
        # Sort by timestamp
        feed.sort(key=lambda x: x["timestamp"], reverse=True)
        return feed
        
    def generate_page_data(self) -> Dict:
        """Generate complete page data for display"""
        return {
            "user_info": {
                "username": self.username,
                "created_at": self.data["created_at"],
                "bitcoin_address": self.data["bitcoin_address"]
            },
            "activity_status": self.data["activity_status"],
            "projects": self.data["projects"],
            "blog_posts": self.data["blog_posts"],
            "donations": self.data["donations"],
            "activity_feed": self.get_activity_feed(),
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat()
            }
        } 