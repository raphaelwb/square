# Rolling Circle

Rolling Circle is a platform game based on the concept of **Vibe Coding**.

🔗 **Learn more about Vibe Coding:** [Vibe Coding - Wikipedia](https://en.wikipedia.org/wiki/Vibe_coding)

"Vibe coding is an AI-dependent programming technique where a person describes a problem in a few sentences as a prompt to a large language model (LLM) tuned for coding."

### ✅ Completed

Any correction or implementation should be
done via prompt in high-level commands, for example: Create a game based on a certain technology,
include a button with a certain functionality ever the character is not walking to the
right side, correct it. In cases where the AI ​​is unable to correct the problem through high-level 
commands, it is possible to read the code and explain where the error is: the 
error is in the function that controls the player. 

🔗 **Play now:** [raphaelwb.github.io/square](https://raphaelwb.github.io/square/)

## 📝 Tasks

### ✅ Completed
- ⚠️ Circle can be controlled.
- 🏠 Game rooms can be created.
- 👀 The Interventor can follow the game's progress.
- It works on mobile, but the browser must be set to desktop mode.
- Removed joistick and included control buttons
- 🏗️ Game environment is now be based on a `level?.txt` file.

### 🔧 To Do
- The representation of \ and / in the level file should be improved.
- 🎯 Add a target platform to complete the game.
- 🚧 Allow the Interventor to add challenges.

## 🚀 Getting Started

### Local Development
To run the game locally:
1. Download the repository.
2. Run `python3 -m http.server 8000` from the command line.
3. Open `http://127.0.0.1:8000/` in your browser.


## Development History

### First Version (branch first_version)
- The game featured a square that could jump and move sideways.
- The AI was not forced to use collision libraries and created its own collision control system.
- As new features were added, problems with the collision control increased.

### Second Version (branch Development and Main)
- The game was recreated using the **Matter.js** library for physics.
- Collision issues were resolved, resulting in smoother and more engaging gameplay.
- The jumping square was replaced with a **rolling circle**, better utilizing the gravity features of the library.
- I am using cursor IDE, after finishing all free calls, I switched to claude-3-opus
