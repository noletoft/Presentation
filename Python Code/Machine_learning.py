

# # # # # # # # # # # # # # # # # # # # # # # #
# # Machine Learning with tensorflow  - Web 3 # #  
# # # # # # # # # # # # # # # # # # # # # # # # # #



import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import LSTM, Dense, Dropout # type: ignore
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import random

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)
random.seed(42)

# Load the data
btc_data = pd.read_pickle('all_btc_mkt_1d.pickle')
# btc_data = btc_data.resample('D').last()  # Resample data to daily frequency

# Assuming 'Close' is the column with closing prices
data = btc_data['Close'].values.reshape(-1, 1)

# Normalize the data
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(data)

# Create sequences for LSTM
def create_sequences(data, seq_length):
    sequences = []
    labels = []
    for i in range(len(data) - seq_length - 1):
        seq = data[i:(i + seq_length)]
        label = data[i + seq_length]
        sequences.append(seq)
        labels.append(label)
    return np.array(sequences), np.array(labels)

# Define sequence length and create sequences
seq_length = 7  # 1 week of daily intervals
X, y = create_sequences(scaled_data, seq_length)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Build and train an LSTM model
model = Sequential()
model.add(LSTM(50, return_sequences=True, input_shape=(seq_length, 1)))
model.add(Dropout(0.2))
model.add(LSTM(50, return_sequences=False))
model.add(Dropout(0.2))
model.add(Dense(25))
model.add(Dense(1))

model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model
history = model.fit(X_train, y_train, batch_size=1, epochs=50, validation_split=0.2, verbose=1)

# Get the model's predictions
predictions = model.predict(X_test)
predictions = scaler.inverse_transform(predictions)  # Inverse scaling

# Inverse scaling for actual values
y_test_scaled = scaler.inverse_transform(y_test.reshape(-1, 1))

# Plot the results
plt.figure(figsize=(14, 5))
plt.plot(y_test_scaled, color='blue', label='Actual BTC Prices')
plt.plot(predictions, color='red', label='Predicted BTC Prices')
plt.title('BTC Price Prediction')
plt.xlabel('Time')
plt.ylabel('BTC Price')
plt.legend()
plt.show()

# Predict future values
recent_data = scaled_data[-seq_length:].reshape((1, seq_length, 1))

# Predict the next 14 days of values
future_predictions = []
for _ in range(14):  # Predicting the next 14 days
    next_pred = model.predict(recent_data)
    future_predictions.append(next_pred[0, 0])
    next_pred = next_pred.reshape((1, 1, 1))  # Reshape to match dimensions of recent_data
    recent_data = np.append(recent_data[:, 1:, :], next_pred, axis=1)

# Inverse transform to get actual values
future_predictions = scaler.inverse_transform(np.array(future_predictions).reshape(-1, 1))

# Combine actual and predicted values for plotting
all_data = np.append(data, future_predictions).reshape(-1, 1)
all_data = scaler.inverse_transform(all_data)

plt.figure(figsize=(14, 5))
plt.plot(data, color='blue', label='Actual BTC Prices')
plt.plot(range(len(data), len(data) + len(future_predictions)), future_predictions, color='red', label='Predicted BTC Prices')
plt.title('BTC Price Prediction for the Next 14 Days')
plt.xlabel('Time')
plt.ylabel('BTC Price')
plt.legend()
plt.show()