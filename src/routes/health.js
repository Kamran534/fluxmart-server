import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Get server status
 *     description: Returns the current status of the server and available endpoints
 *     security: []
 *     responses:
 *       200:
 *         description: Server is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Server is running"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    graphql: `GraphQL endpoint available at http://localhost:${process.env.PORT || 8080}/graphql`
  });
});

export default router;
/**
 * @swagger
 * /db-status:
 *   get:
 *     tags: [Health]
 *     summary: Get MongoDB connection status
 *     description: Returns the current MongoDB connection state; detailed fields are omitted in production
 *     security: []
 *     responses:
 *       200:
 *         description: Status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 state:
 *                   type: string
 *                 host:
 *                   type: string
 *                 dbName:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get('/db-status', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const conn = mongoose.connection;
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    success: true,
    state: stateMap[conn.readyState] || 'unknown',
  };

  if (isProd) {
    return res.status(200).json(base);
  }

  const response = {
    ...base,
    host: (conn && conn.host) || null,
    dbName: (conn && conn.name) || null,
  };
  res.status(200).json(response);
});
