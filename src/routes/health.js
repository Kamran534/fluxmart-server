import express from 'express';

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
    graphql: `GraphQL endpoint available at http://localhost:${process.env.PORT || 8000}/graphql`
  });
});

export default router;
