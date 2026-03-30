## Contributing

### Branch Naming Convention

Use the following format:

- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`
- `docs/<short-description>`
- `misc/<short-description>`

Examples:

- `feature/user-auth`
- `fix/login-crash`
- `chore/update-deps`
- `docs/readme-setup`
- `misc/temporary-logging`

If you have a security concern please reach out privately

### Local Setup

1. Install Node.js (https://nodejs.org/)
   - check using:
   ```bash
   node -v
   npm -v
2. Clone the repository  
   ```bash
   git clone https://github.com/LingoLinkd/LingoLinked.git
   cd LingoLinked
3. Install Dependencies
   ```bash
   npm install
4. Run audit and fix if needed
   ```bash
   npm audit
   npm audit fix
5. Set up environment variables
   - Create a .env file in server/src, use .env.example
   - Replace MONGO_URI value
6. Generate JWT secret 
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'));"
7. Paste output into .env
   - JWT_SECRET = <generated_string>
8. Run the development server
   ```bash
   npm run dev

### Testing

- Run:
  ```bash
   npm test
- Lint/format:
  ```bash
  npm run lint
  npm run format

### PR Expectations

- Small, focused changes
- Link the issue
- Include testing notes
- Include any other relevant documentation to your best judgement
