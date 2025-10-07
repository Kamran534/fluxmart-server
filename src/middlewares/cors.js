import cors from 'cors';

// Builds and applies CORS middlewares: global, GraphQL, and Swagger
export const applyCors = (app) => {
	// Allowed origins
	const allowedOrigins = [
		'http://localhost:8080',
		'http://localhost:3000',
		'http://localhost:8001',
	];

	// Global CORS - restrict to allowed origins
	app.use(cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true); // allow non-browser clients
			return allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
		},
	}));

	// Route-specific CORS
	const corsGraphql = cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			return allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
		},
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	});
	const corsSwagger = cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			return allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
		},
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
