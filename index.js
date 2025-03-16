const fs = require('fs').promises;
const AdmZip = require('adm-zip');
const { sha3_256 } = require('js-sha3');

// Your email in lowercase
const EMAIL = 'your.email@example.com';

// Function to calculate SHA3-256 hash of a buffer
function calculateSha3_256(buffer) {
  return sha3_256(buffer).toLowerCase();
}

async function processTask2() {
  try {
    // Load and extract the ZIP file (assuming it's uploaded as 'task2.zip')
    const zip = new AdmZip('task2.zip');
    const zipEntries = zip.getEntries();

    // Array to store hashes
    const hashes = [];

    // Process each file in the ZIP
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const fileBuffer = entry.getData(); // Get binary data
        const hash = calculateSha3_256(fileBuffer);
        hashes.push(hash);
      }
    }

    // Sort hashes in descending order
    hashes.sort((a, b) => b.localeCompare(a));

    // Join hashes without separator
    const combinedHashes = hashes.join('');

    // Concatenate with email
    const finalString = combinedHashes + EMAIL;

    // Calculate final SHA3-256 hash
    const finalHash = calculateSha3_256(finalString);

    // Output the result
    console.log('Final Hash:', finalHash);
    console.log('Submit this with:');
    console.log(`!task2 ${EMAIL} ${finalHash}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
processTask2();
