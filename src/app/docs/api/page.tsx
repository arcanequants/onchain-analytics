'use client';

/**
 * Interactive API Documentation Page
 *
 * Uses Swagger UI to render the OpenAPI 3.1 specification
 * Phase 4, Week 8 - Backend Engineering Checklist
 */

import { useEffect } from 'react';
import Script from 'next/script';

export default function ApiDocsPage() {
  useEffect(() => {
    // Initialize Swagger UI when scripts are loaded
    const initSwagger = () => {
      if (typeof window !== 'undefined' && (window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: '/api/openapi',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            (window as any).SwaggerUIBundle.presets.apis,
            (window as any).SwaggerUIStandalonePreset,
          ],
          plugins: [(window as any).SwaggerUIBundle.plugins.DownloadUrl],
          layout: 'StandaloneLayout',
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 2,
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
          persistAuthorization: true,
        });
      }
    };

    // Check if already loaded
    if ((window as any).SwaggerUIBundle) {
      initSwagger();
    } else {
      // Listen for script load
      window.addEventListener('swagger-ui-loaded', initSwagger);
      return () => window.removeEventListener('swagger-ui-loaded', initSwagger);
    }
  }, []);

  return (
    <>
      {/* Swagger UI CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
      />

      {/* Swagger UI JS */}
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => window.dispatchEvent(new Event('swagger-ui-loaded'))}
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />

      {/* Custom styles */}
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }

        .swagger-ui .topbar {
          background-color: #1a1a2e;
          padding: 10px 0;
        }

        .swagger-ui .topbar .download-url-wrapper {
          display: flex;
          align-items: center;
        }

        .swagger-ui .info .title {
          color: #1a1a2e;
        }

        .swagger-ui .info .title small.version-stamp {
          background-color: #6366f1;
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #10b981;
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #3b82f6;
        }

        .swagger-ui .btn.execute {
          background-color: #6366f1;
          border-color: #6366f1;
        }

        .swagger-ui .btn.execute:hover {
          background-color: #4f46e5;
          border-color: #4f46e5;
        }

        .swagger-ui section.models {
          border-color: #e5e7eb;
        }

        .swagger-ui section.models h4 {
          color: #1a1a2e;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a2e;
          }

          .swagger-ui {
            background-color: #1a1a2e;
          }

          .swagger-ui .info .title,
          .swagger-ui .info .description,
          .swagger-ui .info .info__contact,
          .swagger-ui .info .info__license,
          .swagger-ui .opblock .opblock-summary-description,
          .swagger-ui table thead tr th,
          .swagger-ui table tbody tr td,
          .swagger-ui .model-title,
          .swagger-ui .model {
            color: #e5e7eb;
          }

          .swagger-ui .opblock .opblock-section-header {
            background: rgba(255, 255, 255, 0.05);
          }

          .swagger-ui input,
          .swagger-ui textarea,
          .swagger-ui select {
            background-color: #2a2a3e;
            color: #e5e7eb;
            border-color: #4a4a5e;
          }

          .swagger-ui section.models {
            background-color: #2a2a3e;
            border-color: #4a4a5e;
          }

          .swagger-ui .model-box {
            background-color: #2a2a3e;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">AI Perception API Documentation</h1>
          <p className="mt-2 text-indigo-100">
            Interactive API explorer powered by OpenAPI 3.1
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <a
              href="/api/openapi"
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
              download="openapi.json"
            >
              Download JSON
            </a>
            <a
              href="/api/openapi?format=yaml"
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
              download="openapi.yaml"
            >
              Download YAML
            </a>
          </div>
        </div>
      </header>

      {/* Swagger UI Container */}
      <div id="swagger-ui" />
    </>
  );
}
