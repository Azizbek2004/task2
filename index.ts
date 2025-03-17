import * as crypto from 'crypto';
import * as readlineSync from 'readline-sync';
import { table } from 'table';

// Represents a die with custom face values
class Dice {
    constructor(public faces: number[]) {}

    getFace(index: number): number {
        return this.faces[index];
    }

    numFaces(): number {
        return this.faces.length;
    }

    toString(): string {
        return this.faces.join(',');
    }
}

// Parses command-line arguments into Dice objects
class DiceParser {
    static parse(args: string[]): Dice[] {
        if (args.length < 3) throw new Error('At least three dice are required.');
        const dice: Dice[] = [];
        let faceCount: number | null = null;

        for (const arg of args) {
            const faces = arg.split(',').map(num => {
                const parsed = parseInt(num, 10);
                if (isNaN(parsed)) throw new Error('Dice faces must be integers.');
                return parsed;
            });
            if (faces.length === 0) throw new Error('Each die must have at least one face.');
            if (faceCount === null) faceCount = faces.length;
            else if (faces.length !== faceCount) throw new Error('All dice must have the same number of faces.');
            dice.push(new Dice(faces));
        }
        return dice;
    }
}

// Handles HMAC key generation and calculation
class HMACCalculator {
    static generateKey(): Buffer {
        return crypto.randomBytes(32); // 256-bit key
    }

    static calculateHMAC(key: Buffer, number: number): string {
        return crypto.createHmac('sha3-256', key).update(number.toString()).digest('hex');
    }
}

// Implements fair random number generation
class FairRandomGenerator {
    constructor(private range: number) {}

    generate(prompt: string): number | null {
        const key = HMACCalculator.generateKey();
        const computerNum = crypto.randomInt(0, this.range);
        const hmac = HMACCalculator.calculateHMAC(key, computerNum);
        console.log(`Computer selected a value (0-${this.range - 1}), HMAC: ${hmac}`);

        const userNum = UserInterface.getNumber(this.range, prompt);
        if (userNum === null) return null;

        const result = (computerNum + userNum) % this.range;
        console.log(`Computer: ${computerNum} (Key: ${key.toString('hex')})`);
        console.log(`Result: ${computerNum} + ${userNum} = ${result} (mod ${this.range})`);
        return result;
    }
}

// Calculates win probability between two dice
class ProbabilityCalculator {
    static calculate(dice1: Dice, dice2: Dice): number {
        let wins = 0;
        for (const face1 of dice1.faces) {
            for (const face2 of dice2.faces) {
                if (face1 > face2) wins++;
            }
        }
        const total = dice1.numFaces() * dice2.numFaces();
        return total > 0 ? wins / total : 0;
    }
}

// Renders the probability table
class TableRenderer {
    static render(dice: Dice[]): void {
        const headers = ['Dice \\ Opponent', ...dice.map(d => d.toString())];
        const data = dice.map(d1 => [
            d1.toString(),
            ...dice.map(d2 => d1 === d2 ? '-' : ProbabilityCalculator.calculate(d1, d2).toFixed(4))
        ]);
        console.log('\nWin Probability Table:');
        console.log(table([headers, ...data]));
    }
}

// Manages user interaction
class UserInterface {
    static getNumber(range: number, prompt: string): number | null {
        console.log(prompt);
        console.log([...Array(range).keys()].map(i => `${i} - ${i}`).join('\n'));
        console.log('X - Exit\n? - Show help');
        const input = readlineSync.question('Your choice: ').trim().toUpperCase();

        if (input === 'X') process.exit(0);
        if (input === '?') return null;
        const num = parseInt(input, 10);
        return !isNaN(num) && num >= 0 && num < range ? num : (console.log('Invalid input.'), null);
    }

    static selectDice(dice: Dice[]): number | null {
        return this.getNumber(dice.length, 'Select your die:');
    }
}

// Controls the game logic
class Game {
    constructor(private dice: Dice[]) {}

    determineFirst(): 'computer' | 'user' | null {
        console.log('\nDetermining first selector...');
        const generator = new FairRandomGenerator(2);
        const result = generator.generate('Guess my number (0 or 1):');
        if (result === null) return null;
        return result === 0 ? 'computer' : 'user';
    }

    selectDice(first: 'computer' | 'user'): [Dice | null, Dice | null] {
        const available = [...this.dice];
        let computerDie: Dice | null = null;
        let userDie: Dice | null = null;

        if (first === 'computer') {
            const compIdx = crypto.randomInt(0, available.length);
            computerDie = available.splice(compIdx, 1)[0];
            console.log(`Computer chose: [${computerDie}]`);
            const userIdx = UserInterface.selectDice(available);
            if (userIdx === null) return [null, null];
            userDie = available[userIdx];
            console.log(`You chose: [${userDie}]`);
        } else {
            const userIdx = UserInterface.selectDice(available);
            if (userIdx === null) return [null, null];
            userDie = available.splice(userIdx, 1)[0];
            console.log(`You chose: [${userDie}]`);
            const compIdx = crypto.randomInt(0, available.length);
            computerDie = available[compIdx];
            console.log(`Computer chose: [${computerDie}]`);
        }
        return [computerDie, userDie];
    }

    roll(die: Dice, player: string): number | null {
        console.log(`\n${player}'s roll:`);
        const generator = new FairRandomGenerator(die.numFaces());
        const index = generator.generate(`Enter a number (0-${die.numFaces() - 1}):`);
        if (index === null) return null;
        const result = die.getFace(index);
        console.log(`${player} rolled: ${result}`);
        return result;
    }

    play(): void {
        while (true) {
            const first = this.determineFirst();
            if (first === null) {
                TableRenderer.render(this.dice);
                continue;
            }
            const [computerDie, userDie] = this.selectDice(first);
            if (!computerDie || !userDie) {
                TableRenderer.render(this.dice);
                continue;
            }
            const computerRoll = this.roll(computerDie, 'Computer');
            if (computerRoll === null) {
                TableRenderer.render(this.dice);
                continue;
            }
            const userRoll = this.roll(userDie, 'You');
            if (userRoll === null) {
                TableRenderer.render(this.dice);
                continue;
            }
            console.log(`\nResult: ${userRoll} vs ${computerRoll}`);
            if (userRoll > computerRoll) console.log('You win!');
            else if (userRoll < computerRoll) console.log('Computer wins!');
            else console.log('Tie!');
            break;
        }
    }
}

if (require.main === module) {
    try {
        const dice = DiceParser.parse(process.argv.slice(2));
        new Game(dice).play();
    } catch (e) {
        console.error(`Error: ${e.message}`);
        console.error('Usage: node script.js <dice1> <dice2> <dice3> ...');
        console.error('Example: node script.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
        process.exit(1);
    }
}