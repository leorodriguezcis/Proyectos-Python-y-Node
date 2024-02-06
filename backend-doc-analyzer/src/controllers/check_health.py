from fastapi import APIRouter


router = APIRouter(tags=["GPT Document Analizer"])


@router.get(path="/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
