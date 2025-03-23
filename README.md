# Square

Circle is a platform game based on the concept of **Vibe Coding**.

🔗 **Learn more about Vibe Coding:** [Vibe Coding - Wikipedia](https://en.wikipedia.org/wiki/Vibe_coding)

🔗 **Play now:** [raphaelwb.github.io/square](https://raphaelwb.github.io/square/)

## 📝 Tasks

### ✅ Completed
- 🏗️ Game environment is built based on a `level.txt` file.
- ⬆️ Controller can jump using the space key.
- 🏠 Game rooms can be created.
- 👀 The Interventor can follow the game's progress.

### 🔧 To Do
- ⚠️ The platform is appearing in the middle of the environment.
- 🎯 Add a target platform to complete the game.
- 🚧 Allow the Interventor to add challenges.

## 🚀 Getting Started

### Local Development
To run the game locally:
1. Download the repository.
2. Run `python3 -m http.server 8000` from the command line.
3. Open `http://127.0.0.1:8000/` in your browser.

### Corrections and features that have been implemented since the last update.
1. Added version number.
2. Translated texts to English.
3. Improved the score display.
4. Added barriers.

### First Version
- The game featured a square that could jump and move sideways.
- The AI was not forced to use collision libraries and created its own collision control system.
- As new features were added, problems with the collision control increased.

### Second Version
- The game was recreated using the **Matter.js** library for physics.
- Collision issues were resolved, resulting in smoother and more engaging gameplay.
- The jumping square was replaced with a **rolling circle**, better utilizing the gravity features of the library.
