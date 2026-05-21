import os
import re
import time
from datetime import datetime, date, time as dt_time
from sqlalchemy import select, insert, delete
from backend.app.database.connection import engine, Base, AsyncSessionLocal
from backend.app.models.sensor_models import Encargado, Zona, Sensor, Medida

# SQL path finder
SQL_FILE_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..", "..", "..", "sensores_normalizado_mysql.sql"
    )
)

async def initialize_schema():
    """Initializes the database schema by creating all tables if they do not exist."""
    async with engine.begin() as conn:
        # SQLite does not support some complex schemas, but standard declarative works fine
        await conn.run_sync(Base.metadata.create_all)

async def reset_database():
    """Deletes all records from all tables to prepare for a fresh migration load."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await session.execute(delete(Medida))
            await session.execute(delete(Sensor))
            await session.execute(delete(Zona))
            await session.execute(delete(Encargado))
            await session.commit()

class ETLMigrationService:
    @staticmethod
    def parse_sql_file():
        """
        Parses the mysql.sql file and extracts row mappings for each table.
        This represents the 'Extract' and 'Transform' phase of our ETL.
        """
        if not os.path.exists(SQL_FILE_PATH):
            raise FileNotFoundError(f"MySQL seeding file not found at {SQL_FILE_PATH}")
            
        with open(SQL_FILE_PATH, "r", encoding="utf-8") as f:
            sql_content = f.read()

        logs = []
        logs.append(f"[{datetime.now().isoformat()}] 📂 Extraction Started: Reading MySQL seed file.")
        
        # Datasets
        encargados = []
        zonas = []
        sensores = []
        medidas = []

        # Regular Expressions to capture INSERT INTO structures
        # Multi-line handling for values
        insert_pattern = re.compile(
            r"INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*(.*?);",
            re.DOTALL | re.IGNORECASE
        )

        matches = insert_pattern.findall(sql_content)
        logs.append(f"[{datetime.now().isoformat()}] 🔍 Extraction Completed: Found {len(matches)} INSERT statements.")

        for table_name, columns_str, values_str in matches:
            table_name = table_name.lower().strip()
            columns = [c.strip().replace("`", "") for c in columns_str.split(",")]
            
            # Value splitter by rows e.g. (1, 'Yesid Avila', ...), (2, ...)
            # We must be careful with commas inside strings, let's use a regex to split rows safely
            row_pattern = re.compile(r"\(([^)]+)\)")
            rows = row_pattern.findall(values_str)
            
            logs.append(f"[{datetime.now().isoformat()}] ⚡ Transformation Started for table '{table_name}' with {len(rows)} records.")
            
            for row in rows:
                # Split columns safely, respecting quotes
                # Using a parser that splits by comma only if it's not inside single quotes
                cells = []
                current_cell = []
                in_quotes = False
                
                for char in row:
                    if char == "'":
                        in_quotes = not in_quotes
                        current_cell.append(char)
                    elif char == "," and not in_quotes:
                        cells.append("".join(current_cell).strip())
                        current_cell = []
                    else:
                        current_cell.append(char)
                cells.append("".join(current_cell).strip())

                # Clean cell values
                cleaned_cells = []
                for cell in cells:
                    cell_val = cell.strip()
                    if cell_val.upper() == "NULL":
                        cleaned_cells.append(None)
                    elif cell_val.startswith("'") and cell_val.endswith("'"):
                        cleaned_cells.append(cell_val[1:-1])  # Strip quotes
                    else:
                        # Number conversions
                        try:
                            if "." in cell_val:
                                cleaned_cells.append(float(cell_val))
                            else:
                                cleaned_cells.append(int(cell_val))
                        except ValueError:
                            cleaned_cells.append(cell_val)
                
                row_dict = dict(zip(columns, cleaned_cells))
                
                # Table specific transformation schema
                if table_name == "encargado":
                    encargados.append(row_dict)
                elif table_name == "zona":
                    zonas.append(row_dict)
                elif table_name == "sensor":
                    sensores.append(row_dict)
                elif table_name == "medida":
                    # Convert date/time string representation to native Python types
                    # Date format: 'YYYY-MM-DD'
                    if isinstance(row_dict["fecha"], str):
                        row_dict["fecha"] = datetime.strptime(row_dict["fecha"], "%Y-%m-%d").date()
                    # Time format: 'HH:MM:SS'
                    if isinstance(row_dict["hora"], str):
                        row_dict["hora"] = datetime.strptime(row_dict["hora"], "%H:%M:%S").time()
                    medidas.append(row_dict)

            logs.append(f"[{datetime.now().isoformat()}] ✅ Transformation Completed for '{table_name}': Data types casted to PostgreSQL targets.")

        return encargados, zonas, sensores, medidas, logs

    @classmethod
    async def execute_etl(cls):
        """
        Runs the complete ETL process: Extraction, Transformation, Load.
        """
        start_time = time.time()
        
        # 1. Initialize schemas
        await initialize_schema()
        
        # 2. Reset existing data to avoid PK conflicts on migration re-run
        await reset_database()

        # 3. Parse & Transform
        try:
            encargados, zonas, sensores, medidas, logs = cls.parse_sql_file()
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed during Extraction/Transformation: {str(e)}",
                "logs": [f"❌ Error: {str(e)}"]
            }

        # 4. Load (Bulk database write transactions)
        logs.append(f"[{datetime.now().isoformat()}] 📥 Load Phase Started: Inserting data into relational structures.")
        
        inserted_encargados = 0
        inserted_zonas = 0
        inserted_sensores = 0
        inserted_medidas = 0

        async with AsyncSessionLocal() as session:
            try:
                # Load Encargados
                if encargados:
                    await session.execute(insert(Encargado), encargados)
                    inserted_encargados = len(encargados)
                    logs.append(f"[{datetime.now().isoformat()}] 👤 Loaded {inserted_encargados} record(s) into 'encargado' table.")

                # Load Zonas
                if zonas:
                    await session.execute(insert(Zona), zonas)
                    inserted_zonas = len(zonas)
                    logs.append(f"[{datetime.now().isoformat()}] 📍 Loaded {inserted_zonas} record(s) into 'zona' table.")

                # Load Sensores
                if sensores:
                    await session.execute(insert(Sensor), sensores)
                    inserted_sensores = len(sensores)
                    logs.append(f"[{datetime.now().isoformat()}] 🔌 Loaded {inserted_sensores} record(s) into 'sensor' table.")

                # Load Medidas (time series)
                if medidas:
                    # Insert in chunks of 200 for database write performance
                    chunk_size = 200
                    for i in range(0, len(medidas), chunk_size):
                        chunk = medidas[i:i+chunk_size]
                        await session.execute(insert(Medida), chunk)
                    inserted_medidas = len(medidas)
                    logs.append(f"[{datetime.now().isoformat()}] 📈 Loaded {inserted_medidas} record(s) into 'medida' time-series table.")

                await session.commit()
                logs.append(f"[{datetime.now().isoformat()}] 🔒 Database Transaction committed successfully.")
            except Exception as e:
                await session.rollback()
                logs.append(f"[{datetime.now().isoformat()}] ❌ Database Transaction rollback due to error: {str(e)}")
                return {
                    "success": False,
                    "error": f"Failed during DB Load Phase: {str(e)}",
                    "logs": logs
                }

        end_time = time.time()
        elapsed = end_time - start_time
        
        logs.append(f"[{datetime.now().isoformat()}] 🏁 ETL PIPELINE FINISHED SUCCESSFULLY IN {elapsed:.3f} SECONDS!")

        return {
            "success": True,
            "duration_seconds": elapsed,
            "counts": {
                "encargado": inserted_encargados,
                "zona": inserted_zonas,
                "sensor": inserted_sensores,
                "medida": inserted_medidas
            },
            "logs": logs
        }
