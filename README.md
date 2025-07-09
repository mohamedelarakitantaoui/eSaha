# eSaha

eSaha is a mental health and wellness platform offering a secure, user-friendly environment for users to access mental health resources, chat with specialists, maintain private journals, and manage appointments. Built with React, TypeScript, Vite, Tailwind CSS, and Supabase, eSaha is designed for scalability, privacy, and ease of use.

## Features

- **Authentication**: Secure login and registration system with protected routes.
- **Dashboard**: Personalized dashboard for quick access to key features.
- **Specialists Directory**: Browse and connect with mental health specialists.
- **Chat**: Real-time chat sessions with mental health professionals.
- **Journal**: Private journaling to track mental health and personal progress.
- **Appointments**: Scheduling calendar for booking and managing appointments.
- **Emergency Contacts**: Store and manage emergency contact information.
- **Resources**: Access curated mental health resources and self-help materials.
- **Settings**: Manage user account and application preferences.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, Lucide Icons
- **State Management**: React Context API
- **Routing**: React Router
- **Backend Services**: Supabase (authentication, storage, database)
- **Other**: Axios (API requests), ESLint/TypeScript for quality

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn

### Installation

```bash
git clone https://github.com/mohamedelarakitantaoui/eSaha.git
cd eSaha/Frontend/project-bolt-sb1-kzetayzm\ \(1\)/project
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
Frontend/project-bolt-sb1-kzetayzm (1)/project/
├── src/
│   ├── components/         # Reusable UI components (DashboardLayout, MainDashboard, etc.)
│   ├── contexts/           # React Contexts for authentication and state
│   ├── pages/              # Page components (Login, Register, JournalPage, etc.)
│   ├── App.tsx             # Main application and routing setup
│   └── ...
├── public/
├── package.json
└── ...
```

## Environment Variables

You may need to configure a `.env` file for your Supabase keys and other environment-specific settings.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for improvements or bug fixes.

## License

[MIT](LICENSE)

## Acknowledgements

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
