"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const jobs = [];
// POST /api/enqueue-job
router.post('/enqueue-job', (req, res) => {
    const id = `job_${Date.now()}`;
    const job = {
        id,
        type: req.body.type || 'generic',
        payload: req.body.payload || {},
        createdAt: new Date().toISOString(),
        status: 'queued',
    };
    jobs.push(job);
    // naive background processing simulation
    setTimeout(() => {
        const j = jobs.find((x) => x.id === id);
        if (!j)
            return;
        j.status = 'processing';
        setTimeout(() => {
            j.status = 'done';
        }, 500);
    }, 100);
    return res.json({ ok: true, jobId: id });
});
// GET /api/jobs
router.get('/jobs', (_req, res) => {
    return res.json({ ok: true, jobs });
});
exports.default = router;
