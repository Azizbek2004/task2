Non-Transitive Dice Game
A command-line JavaScript application built with Node.js that simulates a fair, interactive dice game based on non-transitive dice. Players (user and computer) select dice and roll them, with outcomes determined by a provably fair random number generation process. The game includes a probability table to aid strategic decisions.

Overview
Non-transitive dice exhibit a fascinating property where the "better than" relationship doesn't follow a transitive order (e.g., Die A beats Die B, Die B beats Die C, but Die C beats Die A). This game lets you explore this mathematical curiosity by:

Defining custom dice via command-line arguments.
Choosing dice strategically with the help of a win probability table.
Rolling dice fairly using cryptographic techniques.
Determining a winner based on roll results.
Features
Custom Dice: Accepts an arbitrary number of dice (minimum 3), each with 6 integer faces.
Fair Random Generation: Uses cryptographic methods (HMAC with SHA3-256) to ensure unbiased rolls, verifiable by the user.
Probability Table: Displays win probabilities for each die pair in a formatted ASCII table, accessible via the ? command.
Interactive CLI: User-friendly interface with options to select dice, view help, or exit.
Error Handling: Provides clear error messages for invalid inputs.
Prerequisites
Node.js (v14 or higher recommended)
npm (comes with Node.js)
Installation
Clone or Download the Repository:
bash

Collapse

Wrap

Copy
git clone <repository-url>
cd non-transitive-dice-game
Install Dependencies: Install the required cli-table3 package for table formatting:
bash

Collapse

Wrap

Copy
npm install cli-table3
Usage
Run the game by executing the script with dice configurations as command-line arguments. Each argument represents a die with 6 comma-separated integers.

Example Command
bash

Collapse

Wrap

Copy
node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3
Gameplay Steps
Determine First Mover: Guess a number (0 or 1) to influence who selects a die first, verified with HMAC.
Select Dice:
View available dice and enter an index (e.g., 0) to choose.
Type ? to see the probability table or X to exit.
Roll Dice: Input numbers (0–5) to contribute to fair roll outcomes.
View Results: See both rolls and the winner.
Sample Output
text

Collapse

Wrap

Copy
Let's determine who makes the first move.
I selected a random value in 0..1 (HMAC=abc123...). Try to guess my selection.
Add your number modulo 2 (0 to 1, X to exit, ? for help): 1
My selection: 0 (KEY=xyz789...). You select first.
Choose your die:
0 - 2,2,4,4,9,9
1 - 6,8,1,1,8,6
2 - 7,5,3,7,5,3
X - exit
? - help
Your selection: ?
Probability of the win for the user:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ User dice v │ 2,2,4,4,9,9 │ 1,1,6,6,8,8 │ 3,3,5,5,7,7 │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ 2,2,4,4,9,9 │ - (0.0000)  │   0.5556    │   0.4444    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ 1,1,6,6,8,8 │   0.4444    │ - (0.0000)  │   0.5556    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ 3,3,5,5,7,7 │   0.5556    │   0.4444    │ - (0.0000)  │
└─────────────┴─────────────┴─────────────┴─────────────┘
Your selection: 0
I choose the 6,8,1,1,8,6 die.
[Rolling process continues...]
You win (9 > 6)!
Error Examples
Too few dice:
bash

Collapse

Wrap

Copy
node game.js 2,2,4,4,9,9
Error: At least three dice are required. Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3
Invalid faces:
bash

Collapse

Wrap

Copy
node game.js 2,2,4,4,9,a 6,8,1,1,8,6 7,5,3,7,5,3
Error: Invalid dice configuration: 2,2,4,4,9,a. All values must be integers.
Project Structure
game.js: Main script containing all game logic.
Classes:
Dice: Represents a die with 6 faces.
DiceParser: Validates and parses command-line arguments.
ProbabilityCalculator: Computes win probabilities.
TableGenerator: Creates the probability table using cli-table3.
CryptoHelper: Handles cryptographic operations (key generation, HMAC).
FairRandomGenerator: Manages fair random number generation.
Game: Orchestrates the game flow and user interaction.
How It Works
Input Parsing: Reads and validates dice from the command line.
First Move: Uses a fair random process (0 or 1) to decide who selects a die first.
Dice Selection: Players choose dice; the second player can’t pick the same die as the first.
Rolling: Each player rolls their die using a fair random index (0–5), combining computer and user inputs.
Winner: Compares roll results to determine the winner or a draw.
Fairness Mechanism
Random numbers are generated fairly using:

A 256-bit secret key (via crypto.randomBytes).
A random integer (via crypto.randomInt).
HMAC-SHA3-256 to commit to the computer’s choice before user input.
Modular addition of user and computer numbers to produce the final result.
Key revelation for user verification.

