import express from 'express';

const router = express.Router();

/**
 * @swagger
 * /graphql:
 *   post:
 *     tags: [GraphQL]
 *     summary: GraphQL endpoint
 *     description: Main GraphQL endpoint for querying and mutating data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: GraphQL query string
 *                 example: "query GetBooks { books { title author } }"
 *               variables:
 *                 type: object
 *                 description: GraphQL variables
 *                 example: {}
 *               operationName:
 *                 type: string
 *                 description: GraphQL operation name
 *                 example: "GetBooks"
 *           examples:
 *             get_books:
 *               summary: Get all books
 *               value:
 *                 query: "query GetBooks { books { title author } }"
 *                 variables: {}
 *                 operationName: "GetBooks"
 *             get_book_titles:
 *               summary: Get book titles only
 *               value:
 *                 query: "query GetBookTitles { books { title } }"
 *                 variables: {}
 *                 operationName: "GetBookTitles"
 *     responses:
 *       200:
 *         description: GraphQL query executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: GraphQL response data
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: GraphQL errors (if any)
 *             examples:
 *               success:
 *                 summary: Successful query
 *                 value:
 *                   data:
 *                     books:
 *                       - title: "The Awakening"
 *                         author: "Kate Chopin"
 *                       - title: "City of Glass"
 *                         author: "Paul Auster"
 *               error:
 *                 summary: Query with errors
 *                 value:
 *                   data: null
 *                   errors:
 *                     - message: "Field 'invalidField' doesn't exist on type 'Book'"
 *                       locations:
 *                         - line: 1
 *                           column: 10
 *       400:
 *         description: Bad request - invalid GraphQL query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - JWT token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Note: This route is handled by GraphQL middleware in the main app
// This file is for Swagger documentation only
router.get('/graphql', (req, res) => {
  res.json({
    message: 'GraphQL endpoint is available via POST method',
    playground: 'Use GraphQL Playground or send POST requests to this endpoint'
  });
});

export default router;
