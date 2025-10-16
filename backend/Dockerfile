# 1. Start with a reliable Python image. 
FROM python:3.11-slim

# 2. Set the main folder for our app inside the container.
WORKDIR /app

# 3. Copy and install the Python packages.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy all your application code into the container.
COPY . .


# 5. Copy your startup script into the container.
COPY entrypoint.sh .
# This command makes the script runnable.
RUN chmod +x entrypoint.sh

# after copying code, security reasons to not run from root
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

# 6. Tell Docker that your app uses port 8000.
EXPOSE 8000

# 7. Set the startup script as the main command for the container.
ENTRYPOINT ["/app/entrypoint.sh"]
# 8. Set the default command to start the web server. This gets passed to the entrypoint script.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
