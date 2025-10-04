import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export const initializeDatabase = async () => {
  try {
    db = await SQLite.openDatabase({
      name: 'seizure_detector.db',
      location: 'default',
    });

    await createTables();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

const createTables = async () => {
  if (!db) throw new Error('Database not initialized');

  // Sensor readings table for offline storage
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      accelerometer_x REAL,
      accelerometer_y REAL,
      accelerometer_z REAL,
      gyroscope_x REAL,
      gyroscope_y REAL,
      gyroscope_z REAL,
      heart_rate INTEGER,
      menthone_level REAL,
      muscle_signal REAL,
      blood_oxygen INTEGER,
      synced INTEGER DEFAULT 0
    )
  `);

  // Seizure events table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS seizure_events (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      location_lat REAL,
      location_lng REAL,
      delta_pct REAL,
      severity TEXT,
      duration INTEGER,
      synced INTEGER DEFAULT 0
    )
  `);

  // ML predictions cache
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS ml_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      sensor_reading_id INTEGER,
      prediction REAL,
      confidence REAL,
      model_version TEXT,
      FOREIGN KEY (sensor_reading_id) REFERENCES sensor_readings (id)
    )
  `);

  // Sync queue for offline operations
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload TEXT,
      timestamp INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending'
    )
  `);

  // User preferences
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
};

// Sensor data operations
export const saveSensorReading = async (data: any) => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.executeSql(
    `INSERT INTO sensor_readings (
      timestamp, accelerometer_x, accelerometer_y, accelerometer_z,
      gyroscope_x, gyroscope_y, gyroscope_z, heart_rate,
      menthone_level, muscle_signal, blood_oxygen, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.timestamp,
      data.accelerometer?.x || 0,
      data.accelerometer?.y || 0,
      data.accelerometer?.z || 0,
      data.gyroscope?.x || 0,
      data.gyroscope?.y || 0,
      data.gyroscope?.z || 0,
      data.heart_rate || 0,
      data.menthone_level || 0,
      data.muscle_signal || 0,
      data.blood_oxygen || 0,
      0, // not synced
    ]
  );

  return result[0].insertId;
};

export const getUnsyncedReadings = async (limit = 100) => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.executeSql(
    'SELECT * FROM sensor_readings WHERE synced = 0 ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );

  const readings = [];
  for (let i = 0; i < result[0].rows.length; i++) {
    readings.push(result[0].rows.item(i));
  }

  return readings;
};

export const markReadingsAsSynced = async (ids: number[]) => {
  if (!db) throw new Error('Database not initialized');

  const placeholders = ids.map(() => '?').join(',');
  await db.executeSql(
    `UPDATE sensor_readings SET synced = 1 WHERE id IN (${placeholders})`,
    ids
  );
};

// Seizure event operations
export const saveSeizureEvent = async (event: any) => {
  if (!db) throw new Error('Database not initialized');

  await db.executeSql(
    `INSERT INTO seizure_events (
      id, timestamp, location_lat, location_lng,
      delta_pct, severity, duration, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.timestamp,
      event.location?.lat || null,
      event.location?.lng || null,
      event.delta_pct || null,
      event.severity || 'unknown',
      event.duration || 0,
      0, // not synced
    ]
  );
};

export const getSeizureHistory = async (limit = 50) => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.executeSql(
    'SELECT * FROM seizure_events ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );

  const events = [];
  for (let i = 0; i < result[0].rows.length; i++) {
    events.push(result[0].rows.item(i));
  }

  return events;
};

// ML prediction operations
export const savePrediction = async (prediction: any) => {
  if (!db) throw new Error('Database not initialized');

  await db.executeSql(
    `INSERT INTO ml_predictions (
      timestamp, sensor_reading_id, prediction,
      confidence, model_version
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      prediction.timestamp,
      prediction.sensor_reading_id || null,
      prediction.prediction,
      prediction.confidence,
      prediction.model_version,
    ]
  );
};

export const getRecentPredictions = async (limit = 10) => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.executeSql(
    'SELECT * FROM ml_predictions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );

  const predictions = [];
  for (let i = 0; i < result[0].rows.length; i++) {
    predictions.push(result[0].rows.item(i));
  }

  return predictions;
};

// User preferences
export const savePreference = async (key: string, value: any) => {
  if (!db) throw new Error('Database not initialized');

  const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

  await db.executeSql(
    'INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)',
    [key, valueStr]
  );
};

export const getPreference = async (key: string) => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.executeSql(
    'SELECT value FROM user_preferences WHERE key = ?',
    [key]
  );

  if (result[0].rows.length > 0) {
    const value = result[0].rows.item(0).value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return null;
};

// Cleanup old data
export const cleanupOldData = async (daysToKeep = 30) => {
  if (!db) throw new Error('Database not initialized');

  const cutoffTimestamp = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

  await db.executeSql(
    'DELETE FROM sensor_readings WHERE timestamp < ? AND synced = 1',
    [cutoffTimestamp]
  );

  await db.executeSql(
    'DELETE FROM ml_predictions WHERE timestamp < ?',
    [cutoffTimestamp]
  );
};

export default {
  initializeDatabase,
  saveSensorReading,
  getUnsyncedReadings,
  markReadingsAsSynced,
  saveSeizureEvent,
  getSeizureHistory,
  savePrediction,
  getRecentPredictions,
  savePreference,
  getPreference,
  cleanupOldData,
};