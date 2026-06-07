FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 首次启动时下载模型
RUN python -c "from rembg import new_session; new_session('u2net')"

# 复制应用
COPY app.py .

# Hugging Face Spaces 默认端口 7860
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
