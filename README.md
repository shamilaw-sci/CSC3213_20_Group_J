# iCrowd E-commerce Platform

See [setup and deployment](docs/deployment.md) before starting the API. Persistent deployments now require explicit database settings and a private signing secret; sample accounts and fake orders are disabled by default. The [15 November remediation report](docs/remediation-2026-11-15.md) records the security fixes, verification results, and upgrade requirements.

For the prepared Windows workspace using the existing Neon database, follow [the local running guide](docs/run-with-neon.md). Run `.\scripts\start-local.ps1` from the project folder to start both servers, open **http://localhost:5173**, and use `.\scripts\stop-local.ps1` to stop them.

See [what belongs in Git](docs/repository-files.md) before committing logs, backups, environment files, or generated output.

## Introduction
Welcome to the iCrowd E-commerce Platform! This project is a centralized digital storefront built specifically for phone accessories. It is designed to upgrade traditional retail operations into a fully scalable, digital experience, providing an easy-to-use shopping interface for customers and powerful inventory management tools for store administrators.

## Project Outline
This platform is built using a **Monorepo** structure, meaning both the frontend user interface and the backend server code are housed in this single repository. It follows a **Vertical Slice** architecture, where code is organized by features (like Products, Cart, Auth) rather than by technical layers.

### 1. Frontend Interface (`iCrowd_UI`)
The frontend is built using **React** and styled with **Tailwind CSS v4**. It provides a responsive, dynamic experience for users to:
- Browse the product catalog with advanced filtering and search features (including typo auto-correction).
- View detailed product pages and manage their shopping cart.
- Securely log in and track their orders.
- (For Admins) Manage inventory and view analytics dashboards.

### 2. Backend Server (`icrowd_api`)
The backend is a RESTful API built with **Java Spring Boot**. It handles all the heavy lifting and business logic:
- **Database Management:** Safely stores products, categories, and user data.
- **Data Integrity:** Utilizes ACID-compliant transactions and row-level locking to prevent inventory overselling when multiple customers check out simultaneously.
- **Security:** Protects routes using Role-Based Access Control (RBAC) and JSON Web Tokens (JWT) to ensure customers cannot access admin privileges.

## Feature Documentation
For detailed information on exactly how specific features are built, please check the `product.md` (or similar feature files) located inside the respective feature folders of both the frontend and backend.
