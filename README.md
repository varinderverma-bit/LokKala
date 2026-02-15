# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## API documentation

APIs are documented with **OpenAPI 3.0 (Swagger)**. The spec lives in `docs/openapi.yaml` and covers:

- **LokKala BFF** (`/api/lokkala`) – auth login, upload presign, artifacts list/detail, order creation
- **Order Service** (`/api/orders`) – list/get orders, status, shipments, inventory

**Using the spec:**

- **Swagger UI** – Use any OpenAPI viewer (e.g. [Swagger Editor](https://editor.swagger.io/) or `npx @redocly/cli preview-docs docs/openapi.yaml`) to browse and try endpoints. Set the server URL to your API Gateway or CloudFront base URL.
- **Postman** – In Postman, **Import → Link** or **Import → File** and select `docs/openapi.yaml` to generate a collection. Set the `apiHost` variable to your deployed API host.

The single OpenAPI file is the source of truth; keep it in sync when adding or changing API routes.

## CI/CD and integration tests

A GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on push/PR to `main`:

- **Lint & unit tests** – ESLint, TypeScript, Vitest (frontend).
- **Build frontend** – Vite build; artifact uploaded for later deploy.
- **Build & synth CDK** – Infrastructure is type-checked and synthesized.
- **Deploy** (only on push to `main`) – Deploys the CDK stack when AWS credentials are configured.
- **Integration tests** – After a successful deploy, runs E2E API tests against the deployed API (LokKala artifacts, Order Service, app root).

### Enabling deploy and integration tests

1. In the repo: **Settings → Secrets and variables → Actions**, add:
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`
2. Optional: **Variables** – `AWS_REGION` (default `us-east-1`).
3. Create an environment (e.g. `staging`) and use it in the workflow if you use environments for approvals.

### Running integration tests locally

```bash
# Against a deployed API (e.g. API Gateway URL from CDK outputs)
E2E_API_BASE_URL=https://your-api-id.execute-api.region.amazonaws.com npm run test:integration
```
