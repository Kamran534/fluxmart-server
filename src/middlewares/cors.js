import cors from 'cors';

// Builds and applies CORS middlewares: global, GraphQL, and Swagger
export const applyCors = (app) => {
	// Global CORS - allow all origins; route-specific CORS can further constrain as needed
	app.use(cors());

	// Route-specific CORS
	const corsGraphql = cors({
		origin: '*',
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	});
	const corsSwagger = cors({
		origin: '*',
		methods: ["GET", "OPTIONS"],
		allowedHeaders: ["Content-Type"],
	});

	// Preflight handlers
	app.options('/graphql', corsGraphql);
	app.options('/api-docs', corsSwagger);
	app.options('/api-docs.json', corsSwagger);

	// Mount route-specific CORS (callers should mount their handlers after this)
	app.use('/graphql', corsGraphql);
	app.use('/api-docs', corsSwagger);
};

export default applyCors;
