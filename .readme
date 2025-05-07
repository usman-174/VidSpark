# VidSpark

A full-stack application with a React client frontend and Node.js server backend.

## Project Structure

```
vidspark/
├── client/             # React client application using Vite
│   ├── src/            # Client source code
│   └── package.json    # Client dependencies
├── server/             # Node.js server application
│   ├── src/            # Server source code
│   └── package.json    # Server dependencies
└── package.json        # Root package.json for running both applications
```

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- [npm](https://www.npmjs.com/) (v8.x or higher)

## Getting Started

Follow these steps to set up and run the project for development:

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/vidspark.git
cd vidspark
```

### 2. Install dependencies

You can install all dependencies (root, client, and server) with a single command:

```bash
npm run install-all
```

Alternatively, you can install dependencies separately:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

Create the necessary environment files:

For the server:
```bash
cd server
cp .env.example .env
```

For the client (if required):
```bash
cd client
cp .env.example .env
```

Edit the `.env` files to include your specific configuration details.

### 4. Running the Application

From the root directory, you can run both the client and server concurrently:

```bash
npm run dev
```

This will start:
- Client on: http://localhost:5173 (using Vite)
- Server on: http://localhost:3000 (or as configured in your server)

You can also run each application separately:

```bash
# Run only the client
npm run client

# Run only the server
npm run server
```

### 5. Available Scripts

- `npm run dev`: Runs both client and server in development mode
- `npm run client`: Runs only the client in development mode
- `npm run server`: Runs only the server in development mode
- `npm run install-all`: Installs dependencies for root, client, and server

## Building for Production

### Client Build

```bash
cd client
npm run build
```

The built files will be in the `client/dist` directory.

### Server Build

```bash
cd server
npm run build
```

The compiled JavaScript files will be in the `server/dist` directory.

## Technology Stack

### Client
- React
- Vite
- TypeScript
- Radix UI components
- ESLint for linting

### Server
- Node.js
- TypeScript
- Express.js
- Prisma ORM
- ts-node-dev for development

## Prisma Commands

If you make changes to your Prisma schema:

```bash
cd server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
```

## Additional Information

For more detailed documentation, please refer to:
- [Client Documentation](/client/README.md) (if available)
- [Server Documentation](/server/README.md) (if available)

## Troubleshooting

**Port conflicts**: If you encounter port conflicts, you can modify the ports in:
- Client: `vite.config.ts`
- Server: `.env` file or directly in your server configuration

**Database issues**: Make sure your database is running and accessible with the credentials provided in your server's `.env` file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.