import uvicorn
from src.bootstrap import init_routes
from src.app import app

# from src.entities.tables import Base,engine


if __name__ == "__main__":
    # Base.metadata.drop_all(engine)    ## deleted all tables
    # Base.metadata.create_all(engine)  ## create all tables
    uvicorn.run("main:app", host="0.0.0.0", port=3001, forwarded_allow_ips="*")
