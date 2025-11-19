"""
Database migration to add objective column to prompts table
Run this script to update existing database schema
"""

import sqlite3
import os
from pathlib import Path

def migrate():
    """Add objective column to prompts table"""
    # Get database path
    db_path = Path(__file__).parent.parent.parent / 'promptlab.db'
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(prompts)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'objective' in columns:
            print("Column 'objective' already exists in prompts table")
            return True
        
        # Add objective column
        print("Adding 'objective' column to prompts table...")
        cursor.execute("ALTER TABLE prompts ADD COLUMN objective TEXT")
        
        conn.commit()
        print("Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
        
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    migrate()
