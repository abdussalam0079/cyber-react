# TODO - Frontend/Backend Consolidation

- [x] Inspect repository structure
- [x] Read root + frontend + backend entry files to compare duplicates
- [ ] Copy/merge missing frontend files so the frontend app lives only under `frontend/`
- [ ] Copy/merge missing backend files so backend logic lives only under `backend/`
- [ ] Update any imports/config that reference old paths
- [ ] Decide what to do with duplicate root `src/` and root `server.js` after consolidation
- [ ] Run and verify:
  - [ ] `cd frontend && npm run build` (or `npm run dev`)
  - [ ] `cd backend && npm run dev`
  - [ ] root `npm run dev` if intended

