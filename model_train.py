import joblib
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
import numpy as np
import os

def train():
    print("Loading MNIST dataset...")
    # fetch_openml can be slow, but it's the standard sklearn way
    X, y = fetch_openml('mnist_784', version=1, return_X_y=True, as_frame=False, parser='liac-arff')
    
    # Scale data to [0, 1]
    X = X / 255.0
    
    # Split into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training MLPClassifier (Scikit-learn)...")
    # A simple MLP is usually enough for MNIST to get >95%
    clf = MLPClassifier(hidden_layer_sizes=(100,), max_iter=20, alpha=1e-4,
                        solver='sgd', verbose=10, random_state=1,
                        learning_rate_init=.1)
    
    clf.fit(X_train, y_train)
    
    accuracy = clf.score(X_test, y_test)
    print(f"Training complete. Accuracy: {accuracy:.4f}")
    
    # Save the model
    joblib.dump(clf, 'model.pkl')
    print("Model saved as model.pkl")

if __name__ == "__main__":
    train()
