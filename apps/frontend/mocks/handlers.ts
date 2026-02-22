import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8010/api/v1';

export const handlers = [
  // Health check endpoint
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({ status: 'healthy' });
  }),

  // Themes endpoints
  http.get(`${API_BASE}/themes`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test Theme',
        notes: 'A test theme',
        num_whiskeys: 3,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]);
  }),

  http.post(`${API_BASE}/themes`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: 999,
      name: body.name,
      notes: body.notes || '',
      num_whiskeys: body.num_whiskeys || 0,
      created_at: new Date().toISOString(),
    });
  }),

  // Whiskeys endpoints
  http.get(`${API_BASE}/themes/:themeId/whiskeys`, ({ params }) => {
    return HttpResponse.json([
      {
        id: 1,
        theme_id: parseInt(params.themeId as string),
        name: 'Test Whiskey 1',
        proof: 45.0,
      },
      {
        id: 2,
        theme_id: parseInt(params.themeId as string),
        name: 'Test Whiskey 2',
        proof: 50.0,
      },
    ]);
  }),

  http.put(`${API_BASE}/themes/:themeId/whiskeys`, async ({ request, params }) => {
    const body = (await request.json()) as any[];
    return HttpResponse.json(
      body.map((w, idx) => ({
        id: idx + 1,
        theme_id: parseInt(params.themeId as string),
        name: w.name,
        proof: w.proof,
      }))
    );
  }),

  // Users endpoints
  http.get(`${API_BASE}/users`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]);
  }),

  http.post(`${API_BASE}/users`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: 999,
      name: body.name,
    });
  }),

  http.delete(`${API_BASE}/users/:userId`, ({ params }) => {
    return HttpResponse.json({ success: true });
  }),

  // Theme update endpoints
  http.patch(`${API_BASE}/themes/:themeId`, async ({ request, params }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: parseInt(params.themeId as string),
      name: body.name || 'Updated Theme',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
    });
  }),

  http.put(`${API_BASE}/themes/:themeId`, async ({ request, params }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: parseInt(params.themeId as string),
      ...body,
    });
  }),

  // Catch-all for unhandled endpoints (404)
  http.all(`${API_BASE}/*`, () => {
    return new HttpResponse(null, { status: 404 });
  }),

  // Tastings endpoints
  http.post(`${API_BASE}/tastings`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: 999,
      user_id: body.user_id,
      theme_id: body.theme_id,
      scores: body.scores,
      created_at: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE}/tastings/themes/:themeId/scores`, ({ params }) => {
    return HttpResponse.json({
      theme_id: parseInt(params.themeId as string),
      whiskeys: [
        {
          id: 1,
          name: 'Test Whiskey 1',
          avg_aroma: 4.5,
          avg_flavor: 4.0,
          avg_finish: 4.5,
          avg_total: 4.33,
          rank: 1,
        },
        {
          id: 2,
          name: 'Test Whiskey 2',
          avg_aroma: 3.5,
          avg_flavor: 3.0,
          avg_finish: 3.5,
          avg_total: 3.33,
          rank: 2,
        },
      ],
    });
  }),
];
