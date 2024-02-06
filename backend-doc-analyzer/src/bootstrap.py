from fastapi import FastAPI

def init_routes(app: FastAPI):
    from fastapi import APIRouter
    import pkgutil

    from src import controllers

    api_router = APIRouter(prefix="/api", redirect_slashes=False)

    for loader, module_name, _ in pkgutil.walk_packages(controllers.__path__):
        _module = loader.find_module(module_name).load_module(module_name)
        _router = getattr(_module, "router", None)
        if _router:
            api_router.include_router(_router)

    app.include_router(api_router)
