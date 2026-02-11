"""
Utility functions for the application
"""
from datetime import datetime, timedelta, timezone

# India Standard Time (IST) is UTC+5:30
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current time in IST timezone"""
    return datetime.now(IST)

def get_utc_now():
    """Get current time in UTC (for backward compatibility)"""
    return datetime.utcnow()

# Use IST as default
now = get_ist_now
