# Frontend Client Service

![Next.js](https://img.shields.io/badge/next.js-14.0.0+-success.svg)
![React](https://img.shields.io/badge/react-18.0.0+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0.0+-3178C6.svg)

Web interface for genassist.

## Features

### 3D Model Generation

![3D Model Generation](../../docs/3d-model-gen.gif)

### Documentation Generation

![Documentation Generation](../../docs/doc-gen.gif)

### Image Generation

![Image Generation](../../docs/image-gen.gif)

### React Client Interface

![React Client Interface](../../docs/react-client.gif)

## Development Setup

### Prerequisites

- Node.js >= 18
- npm or yarn
- Google Cloud CLI

### Installation

```bash
npm install
```

### or

```bash
yarn install
```

### Configuration

Configure environment variables:

```bash
# Copy the example environment file
cp src/.env.local.example src/.env.local

# Open the .env.local file and update the following variables:
# - NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 (or where ever backend service is hosted)
```

### Running Development Server

```bash
npm run dev
```

### or

```bash
yarn dev
```

The application will be available at `http://localhost:3000`
