const Joi = require('joi');

// Single-reading ingest — accepts both ESP32 native field names and legacy aliases.
//   Native (preferred): temp, hum, door (bool), voc, compressor
//   Legacy:             temperature, humidity, doorStatus (string)
const sensorReadingSchema = Joi.object({
  deviceId: Joi.string().min(3).max(20).required().messages({
    'any.required': 'deviceId is required',
  }),

  // Temperature — accept native "temp" or legacy "temperature"
  temp:        Joi.number().min(-50).max(100),
  temperature: Joi.number().min(-50).max(100),

  // Humidity — accept native "hum" or legacy "humidity"
  hum:      Joi.number().min(0).max(100),
  humidity: Joi.number().min(0).max(100),

  // Door — accept native bool "door" or legacy string "doorStatus"
  door:       Joi.boolean(),
  doorStatus: Joi.string().valid('open', 'closed'),

  // New fields
  voc:        Joi.number().integer().min(0).max(65535).default(0),
  compressor: Joi.boolean().default(false),

  timestamp: Joi.string().isoDate().optional(),
})
  .or('temp', 'temperature')
  .or('hum', 'humidity')
  .or('door', 'doorStatus');

// Batch ingest — ESP32 firmware native payload (array of readings, snake_case or camelCase)
const batchSensorReadingSchema = Joi.object({
  device_id: Joi.string().min(3).max(20).required().messages({
    'any.required': 'device_id is required',
  }),
  readings: Joi.array().min(1).max(20).required().items(
    Joi.object({
      // Temperature
      temp:        Joi.number().min(-50).max(100),
      temperature: Joi.number().min(-50).max(100),
      // Humidity
      hum:         Joi.number().min(0).max(100),
      humidity:    Joi.number().min(0).max(100),
      // Door
      door:        Joi.boolean(),
      door_state:  Joi.boolean(),
      doorStatus:  Joi.string().valid('open', 'closed'),
      // New fields (native or legacy alias)
      voc:              Joi.number().integer().min(0).max(65535).default(0),
      voc_index:        Joi.number().default(0),
      compressor:       Joi.boolean().default(false),
      compressor_state: Joi.boolean().default(false),
    })
  ).messages({
    'any.required': 'readings array is required',
    'array.min':    'at least one reading is required',
  }),
});

module.exports = { sensorReadingSchema, batchSensorReadingSchema };
