import re
from sqlalchemy import text
from backend.app.database.connection import engine

class SQLPlaygroundService:
    @staticmethod
    def is_query_safe(query: str) -> bool:
        """
        Validates that the query is read-only (SELECT) to prevent SQL injections or destructive
        operations like DROP, DELETE, UPDATE, INSERT, ALTER inside the sandbox.
        """
        clean_query = query.strip().upper()
        
        # Must start with SELECT
        if not clean_query.startswith("SELECT") and not clean_query.startswith("WITH"):
            return False
            
        # Blacklist of destructive commands
        blacklist = [
            r"\bINSERT\b", r"\bUPDATE\b", r"\bDELETE\b", r"\bDROP\b", 
            r"\bALTER\b", r"\bCREATE\b", r"\bTRUNCATE\b", r"\bREPLACE\b", 
            r"\bGRANT\b", r"\bREVOKE\b"
        ]
        
        for pattern in blacklist:
            if re.search(pattern, clean_query):
                return False
                
        return True

    @classmethod
    async def run_query(cls, sql_query: str):
        """
        Executes a custom SQL query against the engine.
        Returns the headers, rows, count, and dynamic stats.
        """
        # Safety Check
        if not cls.is_query_safe(sql_query):
            return {
                "success": False,
                "error": "❌ Security Violation: Only read-only queries (SELECT) are permitted in this SQL Playground.",
                "headers": [],
                "rows": []
            }

        try:
            # Connect and execute raw SQL query
            # We open a connection from the engine directly to run raw SQL
            async with engine.connect() as conn:
                result = await conn.execute(text(sql_query))
                
                # Fetch headers
                headers = list(result.keys())
                
                # Fetch row items
                raw_rows = result.fetchall()
                
                # Convert rows to serializable dictionary structures
                rows = []
                for row in raw_rows:
                    row_dict = {}
                    for i, col_name in enumerate(headers):
                        val = row[i]
                        # Handle Date/Time serialization
                        if hasattr(val, "isoformat"):
                            val = val.isoformat()
                        elif hasattr(val, "to_eng_string"): # Decimal numbers
                            val = float(val)
                        row_dict[col_name] = val
                    rows.append(row_dict)

                return {
                    "success": True,
                    "headers": headers,
                    "rows": rows,
                    "count": len(rows),
                    "error": None
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Database Execution Error: {str(e)}",
                "headers": [],
                "rows": []
            }
