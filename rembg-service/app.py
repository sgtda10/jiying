"""
rembg 背景移除服务 — 部署到 Hugging Face Spaces
FastAPI + rembg，接收图片 → 返回透明底PNG
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
import io
import uvicorn

app = FastAPI(title="即影-rembg", version="1.0.0")

# CORS 允许即影前端跨域调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化模型 session（启动时加载，避免每次请求重新加载）
session = new_session("u2net")

@app.get("/")
def root():
    return {"service": "即影-rembg", "status": "running"}

@app.get("/api/health")
def health():
    return {"status": "ok", "model": "u2net"}

@app.post("/api/remove")
async def remove_background(file: UploadFile = File(...)):
    """移除图片背景，返回透明PNG"""
    # 验证文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="请上传图片文件")

    # 读取图片
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB限制
        raise HTTPException(status_code=400, detail="图片大小不能超过10MB")

    try:
        # rembg 移除背景
        result = remove(contents, session=session)
        return Response(
            content=result,
            media_type="image/png",
            headers={"Content-Disposition": 'attachment; filename="removed-bg.png"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"抠图失败: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
