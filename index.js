const crypto = require('crypto');
const readline = require('readline');
const Table = require('cli-table3');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

class Dice {
  constructor(faces) {
    this.faces = faces;
  }

  getFace(index) {
    return this.faces[index];
  }

  getFaces() {
    return [...this.faces];
  }
}

class DiceParser {
  static parseDiceConfigs(args) {
    if (args.length < 3) {
      throw new Error("At least three dice are required. Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
    }

    const diceList = [];
    for (const arg of args) {
      const values = arg.split(',').map(val => {
        const num = parseInt(val.trim(), 10);
        if (isNaN(num)) {
          throw new Error(`Invalid dice configuration: ${arg}. All values must be integers.`);
        }
        return num;
      });
      if (values.length !== 6) {
        throw new Error(`Each die must have exactly 6 faces. Got ${values.length} for ${arg}.`);
      }
      diceList.push(new Dice(values));
    }
    return diceList;
  }
}

class ProbabilityCalculator {
  static calculateWinProbability(diceA, diceB) {
    const facesA = diceA.getFaces();
    const facesB = diceB.getFaces();
    let winCount = 0;
    for (const a of facesA) {
      for (const b of facesB) {
        if (a > b) winCount++;
      }
    }
    return winCount / 36; 
  }
}

class TableGenerator {
  static generateProbabilityTable(diceList) {
    const table = new Table({
      head: ['User dice v', ...diceList.map(d => d.getFaces().join(','))],
      style: { head: ['cyan'] }, 
      colAligns: ['left', ...Array(diceList.length).fill('center')] 
    });

    for (const diceA of diceList) {
      const row = [diceA.getFaces().join(',')];
      for (const diceB of diceList) {
        const prob = ProbabilityCalculator.calculateWinProbability(diceA, diceB);
        const cell = diceA === diceB ? `- (${prob.toFixed(4)})` : prob.toFixed(4);
        row.push(cell);
      }
      table.push(row);
    }

    return `Probability of the win for the user:\n${table.toString()}`;
  }
}

class CryptoHelper {
  static generateKey() {
    return crypto.randomBytes(32); 
  }

  static generateRandomInt(max) {
    return crypto.randomInt(max); 
  }

  static computeHMAC(key, message) {
    return crypto.createHmac('sha3-256', key)
      .update(Buffer.from([message])) 
      .digest('hex');
  }
}

class FairRandomGenerator {
  constructor(range) {
    this.range = range;
    this.key = CryptoHelper.generateKey();
    this.x = CryptoHelper.generateRandomInt(range);
    this.hmac = CryptoHelper.computeHMAC(this.key, this.x);
  }

  getHMAC() {
    return this.hmac;
  }

  computeResult(y) {
    return (this.x + y) % this.range;
  }

  reveal() {
    return { x: this.x, key: this.key.toString('hex') };
  }
}

class Game {
  constructor(args) {
    this.diceList = DiceParser.parseDiceConfigs(args);
  }

  async getUserNumber(range, context = '') {
    while (true) {
      const input = await askQuestion(
        `${context}Add your number modulo ${range} (0 to ${range - 1}, X to exit, ? for help): `
      );
      const trimmed = input.trim().toUpperCase();
      if (trimmed === 'X') {
        process.exit(0);
      } else if (trimmed === '?') {
        console.log("The computer commits to a number with an HMAC. Your input helps determine the final result fairly.");
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 0 && num < range) {
          return num;
        }
        console.log(`Please enter a number between 0 and ${range - 1}.`);
      }
    }
  }

  async selectDice(availableDice) {
    while (true) {
      console.log("Choose your die:");
      availableDice.forEach((dice, i) => console.log(`${i} - ${dice.getFaces().join(',')}`));
      console.log("X - exit");
      console.log("? - help");
      const input = await askQuestion("Your selection: ");
      const trimmed = input.trim().toUpperCase();
      if (trimmed === 'X') {
        process.exit(0);
      } else if (trimmed === '?') {
        console.log(TableGenerator.generateProbabilityTable(this.diceList));
      } else {
        const index = parseInt(trimmed, 10);
        if (!isNaN(index) && index >= 0 && index < availableDice.length) {
          return availableDice[index];
        }
        console.log("Invalid selection. Choose a valid die index.");
      }
    }
  }

  computerSelectDice(availableDice) {
    const index = Math.floor(Math.random() * availableDice.length);
    const selected = availableDice[index];
    console.log(`I choose the ${selected.getFaces().join(',')} die.`);
    return selected;
  }

  async start() {
    console.log("Let's determine who makes the first move.");
    const frg = new FairRandomGenerator(2);
    console.log(`I selected a random value in 0..1 (HMAC=${frg.getHMAC()}). Try to guess my selection.`);
    const y = await this.getUserNumber(2);
    const firstMoveResult = frg.computeResult(y);
    const { x, key } = frg.reveal();
    console.log(`My selection: ${x} (KEY=${key}).`);

    let userDice, computerDice;
    if (firstMoveResult === 0) {
      console.log("You guessed correctly! You select first.");
      userDice = await this.selectDice(this.diceList);
      const remaining = this.diceList.filter(d => d !== userDice);
      computerDice = this.computerSelectDice(remaining);
    } else {
      console.log("I select first.");
      computerDice = this.computerSelectDice(this.diceList);
      const remaining = this.diceList.filter(d => d !== computerDice);
      userDice = await this.selectDice(remaining);
    }

    console.log("\nIt's time for my roll.");
    const compFrg = new FairRandomGenerator(6);
    console.log(`I selected a random value in 0..5 (HMAC=${compFrg.getHMAC()}).`);
    const compY = await this.getUserNumber(6);
    const compResult = compFrg.computeResult(compY);
    const { x: compX, key: compKey } = compFrg.reveal();
    console.log(`My number is ${compX} (KEY=${compKey}).`);
    console.log(`Result: ${compX} + ${compY} = ${compResult} (mod 6).`);
    const compRoll = computerDice.getFace(compResult);
    console.log(`My roll result is ${compRoll}.`);

    console.log("\nIt's time for your roll.");
    const userFrg = new FairRandomGenerator(6);
    console.log(`I selected a random value in 0..5 (HMAC=${userFrg.getHMAC()}).`);
    const userY = await this.getUserNumber(6);
    const userResult = userFrg.computeResult(userY);
    const { x: userX, key: userKey } = userFrg.reveal();
    console.log(`My number is ${userX} (KEY=${userKey}).`);
    console.log(`Result: ${userX} + ${userY} = ${userResult} (mod 6).`);
    const userRoll = userDice.getFace(userResult);
    console.log(`Your roll result is ${userRoll}.`);

    if (userRoll > compRoll) {
      console.log(`You win (${userRoll} > ${compRoll})!`);
    } else if (compRoll > userRoll) {
      console.log(`I win (${compRoll} > ${userRoll})!`);
    } else {
      console.log(`It's a draw (${userRoll} = ${compRoll}).`);
    }
  }
}
const args = process.argv.slice(2);
try {
  const game = new Game(args);
  game.start().then(() => rl.close());
} catch (error) {
  console.error(error.message);
  rl.close();
  process.exit(1);
}