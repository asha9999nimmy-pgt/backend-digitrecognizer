from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DigitInput(BaseModel):
    data: list[float]  # Expecting 784 flattened pixels

model = None

@app.on_event("startup")
def load_model():
    global model
    model_path = 'model.pkl'
    if not os.path.exists(model_path):
        print("Model not found. You should run model_train.py first or implement auto-train here.")
        # For the sake of the requirement: "If model.pkl does not exist, trains and saves it automatically"
        from model_train import train
        train()
    
    model = joblib.load(model_path)
    print("Model loaded successfully.")

@app.post("/predict")
async def predict(input_data: DigitInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Convert list to numpy array and reshape for prediction
        features = np.array(input_data.data).reshape(1, -1)
        
        # Prediction
        prediction = model.predict(features)[0]
        
        # Confidence (MLP output probabilities)
        probabilities = model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
        
        return {
            "prediction": str(prediction),
            "confidence": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
