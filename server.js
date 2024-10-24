const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

// Create a new instance of the Google Cloud Vision client
const client = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, 'single-arcana-439602-n4-f3603f4aa9d6.json') // Replace with the path to your Google Cloud Service Account key
});

// Create a new instance of Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket('single-arcana-439602-n4.appspot.com'); // Replace with your actual bucket name
const app = express();

// Use /tmp directory for storing uploaded files temporarily
const upload = multer({ dest: '/tmp/' });

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve the form from the current directory
});

// Handle the image upload
app.post('/upload', upload.single('pic'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    // Define the destination path in Google Cloud Storage
    const gcsFileName = `uploads/${req.file.originalname}`; // Store in "uploads" folder in GCS

    // Upload the file to Google Cloud Storage
    await bucket.upload(filePath, {
        destination: gcsFileName,
    });

    // Send the image to Google Cloud Vision for label detection
    const [result] = await client.labelDetection(`gs://${bucket.name}/${gcsFileName}`);
    const labels = result.labelAnnotations;

    // Format the labels into an HTML response
    res.send(`
        <h1>Labels Detected</h1>
        <ul>
            ${labels.map(label => `<li>${label.description}: ${label.score.toFixed(2)}</li>`).join('')}
        </ul>
        <a href="/">Upload Another Image</a>
    `);
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
