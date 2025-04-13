import json
from datetime import datetime
import hashlib
from typing import List, Dict
import os

class BitcoinTracker:
    def __init__(self, address: str):
        self.address = address
        self.transactions_file = "transactions.json"
        self.balance_file = "balance.json"
        self.load_data()
        
    def load_data(self):
        """Load existing transaction and balance data"""
        try:
            with open(self.transactions_file, 'r') as f:
                self.transactions = json.load(f)
        except FileNotFoundError:
            self.transactions = []
            
        try:
            with open(self.balance_file, 'r') as f:
                self.balance = json.load(f)
        except FileNotFoundError:
            self.balance = {
                "current_balance": 0,
                "total_received": 0,
                "total_sent": 0,
                "last_updated": datetime.now().isoformat()
            }
            
    def save_data(self):
        """Save transaction and balance data"""
        with open(self.transactions_file, 'w') as f:
            json.dump(self.transactions, f, indent=2)
        with open(self.balance_file, 'w') as f:
            json.dump(self.balance, f, indent=2)
            
    def add_transaction(self, txid: str, amount: float, type: str, timestamp: str = None):
        """Add a new transaction with verification hash"""
        if timestamp is None:
            timestamp = datetime.now().isoformat()
            
        # Create verification hash
        tx_data = {
            "txid": txid,
            "amount": amount,
            "type": type,
            "timestamp": timestamp
        }
        verification_hash = hashlib.sha256(
            json.dumps(tx_data, sort_keys=True).encode()
        ).hexdigest()
        
        transaction = {
            **tx_data,
            "verification_hash": verification_hash
        }
        
        self.transactions.append(transaction)
        
        # Update balance
        if type == "received":
            self.balance["current_balance"] += amount
            self.balance["total_received"] += amount
        elif type == "sent":
            self.balance["current_balance"] -= amount
            self.balance["total_sent"] += amount
            
        self.balance["last_updated"] = timestamp
        self.save_data()
        
    def get_transactions(self) -> List[Dict]:
        """Get all transactions"""
        return self.transactions
        
    def get_balance(self) -> Dict:
        """Get current balance information"""
        return self.balance
        
    def verify_transaction(self, txid: str) -> bool:
        """Verify a transaction's integrity"""
        for tx in self.transactions:
            if tx["txid"] == txid:
                # Recreate verification hash
                tx_data = {
                    "txid": tx["txid"],
                    "amount": tx["amount"],
                    "type": tx["type"],
                    "timestamp": tx["timestamp"]
                }
                expected_hash = hashlib.sha256(
                    json.dumps(tx_data, sort_keys=True).encode()
                ).hexdigest()
                return expected_hash == tx["verification_hash"]
        return False
        
    def generate_transparency_report(self) -> Dict:
        """Generate a complete transparency report"""
        return {
            "address": self.address,
            "balance": self.balance,
            "transaction_count": len(self.transactions),
            "transactions": self.transactions,
            "report_generated": datetime.now().isoformat(),
            "verification_hash": hashlib.sha256(
                json.dumps(self.transactions, sort_keys=True).encode()
            ).hexdigest()
        } 