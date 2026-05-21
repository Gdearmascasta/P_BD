from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from backend.app.database.connection import engine, AsyncSessionLocal
from backend.app.services.migration_service import ETLMigrationService, initialize_schema
from backend.app.routes import sensors, readings, analytics, playground
from sqlalchemy import select, func
from backend.app.models.sensor_models import Medida
import os

# Lifespan event handler for startup/shutdown actions
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on boot
    print("[STARTUP] Initializing Database schemas...")
    await initialize_schema()
    
    async with AsyncSessionLocal() as session:
        try:
            count_res = await session.execute(select(func.count(Medida.id_medicion)))
            count = count_res.scalar() or 0
            if count == 0:
                print("[SEED] Database is empty. Running automatic ETL MySQL -> PostgreSQL seeding...")
                seed_res = await ETLMigrationService.execute_etl()
                print(f"[SEED] Seeding finished successfully: {seed_res['counts']}")
            else:
                print(f"[INFO] Database contains {count} measurements. Ready for queries.")
        except Exception as e:
            print(f"[WARNING] Seeding checks failed (might be a fresh migration context): {e}")
            
    yield
    print("[SHUTDOWN] Shutting down FastAPI application engine.")

app = FastAPI(
    title="Enterprise IoT SCADA Dashboard & SQL Analytics Platform API",
    description="Production-ready FastAPI backend serving environmental time series, migration auditing, and sandboxed Monaco SQL execution.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for local frontend development (if run in separate servers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Backend API Routers under /api prefix
app.include_router(sensors.router, prefix="/api")
app.include_router(readings.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(playground.router, prefix="/api")

# Serve SPA Frontend compiled static assets
# Resolve path dynamically to handle docker environments as well
frontend_dist_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..", "..", "frontend", "dist"
    )
)

# Route fallback handler for single-page applications (React Router compatibility)
@app.middleware("http")
async def spa_router_fallback(request: Request, call_next):
    # Process request through backend routing first
    response = await call_next(request)
    
    # If the response is a 404 and the request path does not start with /api, /docs, or /openapi.json
    # fallback to return index.html of the built React frontend
    if response.status_code == 404 and not request.url.path.startswith(("/api", "/docs", "/openapi.json")):
        index_html = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_html):
            return FileResponse(index_html)
            
    return response

# Mount StaticFiles last so it does not intercept API routers or SPA fallbacks
if os.path.exists(frontend_dist_path):
    print(f"[INFO] Mounting frontend compiled assets from {frontend_dist_path}")
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")
else:
    print(f"[WARNING] Frontend compiled assets directory not found at {frontend_dist_path}. Run 'npm run build' inside /frontend first.")
