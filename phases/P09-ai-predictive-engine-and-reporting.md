# Phase 9: AI Predictive Engine & Narrative Audit Reporting

---

## 1. OBJECTIVE
Implement the Scikit-learn predictive thermal decay engine to forecast breaches before they occur, and implement the Google Gemini Flash / Jinja2 narrative audit generator.

## 2. INPUTS & DEPENDENCIES
- `docs/01-architecture/ai-architecture.md`.
- `scikit-learn` in Python backend.
- Optional `GEMINI_API_KEY` (Free Tier).

## 3. FILES TO CREATE
- `backend/app/engine/ai_predictor.py`
- `backend/app/services/gemini_auditor.py`
- `frontend/src/components/dashboard/PredictiveAlertPill.jsx`
- `backend/tests/test_ai_predictor.py`

## 4. IMPLEMENTATION REQUIREMENTS

### 1. `ai_predictor.py`
- Fits polynomial curve on sliding window of previous 10 telemetry points.
- Computes derivative $\frac{dT}{dt}$.
- Solves for $t$ where $T(t) = 8.0^\circ\text{C}$.
- If $t_{\text{breach}} \le 15\text{ minutes}$, emits `PREDICTIVE_THERMAL_ALERT`.

### 2. `gemini_auditor.py`
- Reads structured on-chain event logs and batch metadata.
- If `GEMINI_API_KEY` is present: Queries Gemini 1.5 Flash to synthesize executive compliance narrative.
- If API key is absent: Executes local deterministic Jinja2 template producing formatted Markdown audit report.

## 5. DEFINITION OF DONE
- [ ] `pytest backend/tests/test_ai_predictor.py` confirms early warning fires when temperature gradient exceeds $+0.2^\circ\text{C}/\text{minute}$.
- [ ] Auditor export produces narrative summary with 100% offline fallback when no API key is provided.
