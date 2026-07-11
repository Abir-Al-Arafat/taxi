---

# Testing WebSocket Location Tracking in Postman

This guide provides instructions to verify the real-time location tracking system using Postman’s native Socket.io support.

### Prerequisites

- **Postman** installed (v9.x or higher recommended).
- A valid **JWT token** for both a `driver` and a `rider`.
- The backend server running on `http://localhost:3000` (or your configured port).

---

### Step 1: Connect to Socket.io

You need to open **two separate Socket.io tabs** in Postman to simulate the "Driver" and the "Rider".

1. In Postman, click **New** -> **Socket.io**.
2. **URL:** Enter `http://localhost:5000/`.
3. **Authentication:**

- Click the **Headers** tab.
- Add a header: `token` with your JWT value (Use a Driver JWT for one tab, Rider JWT for the other).

4. Click **Connect**.
5. _Verify:_ Check your terminal logs; you should see `User connected: <userId>`.

### Step 2: Listen for Events

Before testing, you must tell Postman to listen for incoming location updates.

1. In the bottom **Events** pane, look for **"Listen to events"**.
2. Type `receiveLocation` in the event name field.
3. Click the **"+" (Add)** button.

### Step 3: Join the Ride Room

Both the Driver and Rider must join the same room to communicate.

1. In the **Message** tab (where you compose messages):

- **Event Name:** `joinRideRoom`
- **Message Type:** Text
- **Message:** `ride_12345` (replace `12345` with your active `rideId`)

2. Click **Send**.
3. _Verify:_ Your terminal should log: `Socket <id> joined room: ride_12345`.

### Step 4: Test the Location Broadcast

Now, perform the actual location test.

1. Go to the **Driver's Postman tab**.
2. **Event Name:** `sendLocation`
3. **Message Type:** JSON
4. **Payload:**

```json
{
  "rideId": "6a3cfccf5bf6db8af43143ca",
  "lat": 23.8103,
  "lng": 90.4125,
  "role": "driver"
}
```

5. Click **Send**.

### Step 5: Verify

1. Switch to the **Rider's Postman tab**.
2. Check the **Events** timeline at the bottom.
3. You should see an incoming message under `receiveLocation` containing the GPS data sent by the driver.

---

### Troubleshooting

- **Authentication Error:** If you get an error, ensure the `token` header is set correctly with a valid, unexpired JWT.

- **Events not showing:** Ensure you are in the **same room** (`ride_12345`) in both tabs.

- **Room Formatting:** Ensure the `rideId` string matches exactly what is expected by the logic in `socket.service.ts` (currently expected as `ride_<rideId>`).
