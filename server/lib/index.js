"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const admin = __importStar(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const verifyFirebase_1 = require("./middleware/verifyFirebase");
const processImage_1 = __importDefault(require("./routes/processImage"));
const jobs_1 = __importDefault(require("./routes/jobs"));
dotenv_1.default.config();
const PORT = Number(process.env.PORT || 8080);
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? 'https://culturepass.app,https://www.culturepass.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({ credential: admin.credential.cert(svc) });
    }
    catch (err) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err);
        process.exit(1);
    }
}
else {
    // will use ADC (gcloud auth) if available
    admin.initializeApp();
}
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)((req, callback) => {
    const origin = req.header('Origin');
    if (!origin)
        return callback(null, { origin: false });
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    const isAllowedOrigin = CORS_ALLOWED_ORIGINS.includes(origin) || isLocalhost;
    callback(null, {
        origin: isAllowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
        credentials: false,
        maxAge: 600,
    });
}));
app.use(express_1.default.json());
// Public health
app.get('/health', (_req, res) => res.json({ ok: true, service: 'culturepass-server' }));
// Attach optional auth middleware
app.use((0, verifyFirebase_1.verifyFirebaseToken)());
// Example protected route
app.get('/api/hello', (req, res) => {
    // type narrowing
    const user = req.user;
    if (user)
        return res.json({ ok: true, msg: `hello ${user.uid}`, uid: user.uid });
    return res.json({ ok: true, msg: 'hello anonymous' });
});
// Example utility routes
app.use('/api', processImage_1.default);
app.use('/api', jobs_1.default);
const server = app.listen(PORT, () => {
    console.log(`culturepass-server running on port ${PORT}`);
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process (e.g. lsof -iTCP:${PORT} -sTCP:LISTEN) or set PORT to a free port.`);
    }
    else {
        console.error('Failed to start server:', err);
    }
    process.exit(1);
});
