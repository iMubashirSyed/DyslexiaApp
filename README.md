# DyslexiaApp 🚀

This project was built as a Final Year project.
DyslexiaApp is a React Native application designed to assist children with dyslexia. It leverages AI and various interactive features to aid in learning and cognitive development.

## Project Overview

This project consists of a React Native frontend and a Django backend, providing a comprehensive suite of tools for children with dyslexia. The application aims to make learning engaging and accessible through AI-powered assistance, interactive games, and personalized learning experiences.

## Features ✨

- **AI-Powered Chatbot (Bright Buddy):** An interactive chatbot designed to help children with reading, spelling, vocabulary, and school-related questions.
- **Visual Vocabulary:** AI-generated images for words, aiding in visual learning and memory retention.
- **Letter Tracing:** Interactive exercises to help children practice forming letters correctly.
- **Speech Coach:** Tools to improve pronunciation and speech clarity.
- **Auditory Guided Visualization:** Generates images and sounds based on user prompts to enhance auditory and visual learning.
- **Phrase Simplification:** Simplifies complex text into easier-to-understand language.
- **Animal Bingo:** An engaging game to reinforce vocabulary and learning.
- **Flashcard Generator:** Creates personalized flashcards from user-uploaded images.
- **User Authentication & Preferences:** Secure user login and personalized app settings.

## Tech Stack 🛠️

- **Frontend:** React Native, TypeScript, React Navigation, Axios, React Native Dotenv, React Native SVG, React Native TTS, React Native Sound
- **Backend:** Django, Django REST Framework, Python, Groq AI, OpenAI API, ElevenLabs API, Pollinations API
- **Databases:** SQLite
- **Development Tools:** Node.js, npm/Yarn, Jest, ESLint, Prettier, Babel

## Installation 📦

### Prerequisites

- Node.js (v20 or higher recommended)
- npm or Yarn
- React Native development environment set up ([React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment))
- Python 3.8+ and Django

### Frontend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/iMubashirSyed/DyslexiaApp.git
   cd DyslexiaApp/Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root of the `Frontend` directory and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   POLLINATIONS_API_KEY=your_pollinations_api_key
   ```

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd ../Backend
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the root of the `Backend` directory and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   POLLINATIONS_API_KEY=your_pollinations_api_key
   TESSERACT_CMD=path_to_your_tesseract_executable
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```

## Usage 🚀

### Running the Application

1. **Start Metro bundler (from `Frontend` directory):**
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Run on Android:**
   ```bash
   npm run android
   # or
   yarn android
   ```

3. **Run on iOS:**
   ```bash
   # Install CocoaPods dependencies first if needed
   # bundle install
   # bundle exec pod install
   npm run ios
   # or
   yarn ios
   ```

### Core Features in Action

- **Chat with Bright Buddy:** Navigate to the 'Home' tab and select the 'Voice Chatbot' option to interact with the AI companion.
- **Visual Vocabulary:** Access 'Vocab to Image' or 'Flashcard Generator' from the 'Developer 2' section within the app to create visual aids for words.
- **Letter Tracing:** Find 'Letter Trace' under the 'Developer 1' section for interactive letter formation practice.
- **Animal Bingo:** Access 'Animal Bingo' from the 'Developer 3' section to play the vocabulary-building game.

## Project Structure 📂

```
DyslexiaApp/
├── Backend/
│   ├── dyslexia_app_backend/
│   ├── manage.py
│   ├── mateen/
│   ├── mubashir/
│   ├── umair/
│   ├── requirements.txt
│   └── README.md
├── Frontend/
│   ├── assets/
│   ├── node_modules/
│   ├── patches/
│   ├── scripts/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── __tests__/
│   ├── android/
│   ├── ios/
│   ├── babel.config.js
│   ├── index.js
│   ├── jest.config.js
│   ├── metro.config.js
│   ├── package.json
│   ├── README.md
│   ├── react-native.config.js
│   └── tsconfig.json
└── LICENSE
```

## API Reference 🌐

The backend exposes several API endpoints for the frontend to interact with:

- **Authentication (`/mubashir/`):**
  - `POST /register/`: User registration.
  - `POST /login/`: User login and JWT token generation.
  - `POST /token/refresh/`: Refresh JWT access token.
- **Vocabulary (`/mubashir/`):**
  - `POST /vocabulary-to-image/`: Generate an image for a given word.
  - `GET /vocabulary-to-image/`: Get user's vocabulary image history.
  - `DELETE /vocabulary-to-image/<id>/`: Delete a vocabulary image entry.
  - `POST /flashcard-generator/`: Generate flashcards from an uploaded image.
- **User Features (`/umair/`):**
  - `GET /alphabet-matcher/level/`: Get the current alphabet matcher level.
  - `PUT /alphabet-matcher/level/`: Update the alphabet matcher level.
  - `POST /auditory-visualization/`: Create an auditory visualization (image + sounds).
  - `GET /auditory-visualization/`: Get user's auditory visualization history.
  - `DELETE /auditory-visualization/<id>/`: Delete an auditory visualization.
  - `POST /phrase-conversion/`: Save a simplified phrase.
  - `GET /phrase-conversion/`: Get user's phrase conversion history.
  - `DELETE /phrase-conversion/<id>/`: Delete a phrase conversion.
- **Child Features (`/mateen/`):**
  - `POST /chat/`: Send a message to the Bright Buddy chatbot.
  - `GET /preferences/`: Fetch user's app preferences.
  - `PUT /preferences/`: Update user's app preferences.
  - **Animal Bingo API (`/mateen/bingo/`):**
    - `GET /round/?age_group=...`: Fetch a round of the Animal Bingo game.
    - `GET /words/?age_group=...`: Fetch the full pool of animal words.
    - `POST /verify-text/`: Verify transcribed text for the game.

## License 📜

This project is licensed under the **Apache License 2.0**. See the `LICENSE` file for more details.

## Important Links 🔗

- **Repository:** [https://github.com/iMubashirSyed/DyslexiaApp](https://github.com/iMubashirSyed/DyslexiaApp)
- **LinkedIn Contact:**  [LinkedIn](https://www.linkedin.com/in/syed-mubashir-ali-/)

## Footer 📝

© 2026 DyslexiaApp

Repository owned by [@iMubashirSyed](https://github.com/iMubashirSyed)

Star ⭐, Fork 🍴, and Contribute 💡 to this project!

