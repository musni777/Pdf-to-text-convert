document.getElementById('convertBtn').addEventListener('click', function () {
    const fileInput = document.getElementById('pdfInput');
    if (fileInput.files.length === 0) {
        alert('Please select a PDF file.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const typedarray = new Uint8Array(event.target.result);

        // Load the PDF using pdf.js
        pdfjsLib.getDocument({ data: typedarray }).promise.then(function (pdf) {
            let textContent = '';
            const totalPages = pdf.numPages;

            // Extract text from each page
            const extractPageText = function (pageNum) {
                return pdf.getPage(pageNum).then(function (page) {
                    return page.getTextContent().then(function (text) {
                        return text.items.map(item => item.str).join(' ');
                    });
                });
            };

            // Loop through all pages and extract text
            const extractAllPages = function () {
                const promises = [];
                for (let i = 1; i <= totalPages; i++) {
                    promises.push(extractPageText(i));
                }
                return Promise.all(promises);
            };

            extractAllPages().then(function (pages) {
                textContent = pages.join('\n');

                // Clean up the extracted text
                textContent = cleanText(textContent);

                // Display the cleaned text in the textarea
                document.getElementById('textOutput').value = textContent;

                // Enable the download button
                document.getElementById('downloadBtn').disabled = false;

                // Set up the download functionality
                document.getElementById('downloadBtn').addEventListener('click', function () {
                    downloadTextFile(textContent, 'extracted_text.txt');
                });
            });
        }).catch(function (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF. Please try again.');
        });
    };

    reader.readAsArrayBuffer(file);
});

// Function to clean up the extracted text
function cleanText(text) {
    // Replace common incorrect characters
    text = text.replace(/\+/g, 't'); // Replace '+' with 't'
    text = text.replace(/\]/g, 't'); // Replace ']' with 't'
    text = text.replace(/\[/g, 't'); // Replace '[' with 't'
    text = text.replace(/\|/g, 'l'); // Replace '|' with 'l'
    text = text.replace(/\*/g, '');  // Remove '*' characters

    // Fix spacing issues
    text = text.replace(/\s+/g, ' '); // Replace multiple spaces with a single space

    // Add line breaks for better readability
    text = text.replace(/\.\s+/g, '.\n'); // Add a line break after periods
    text = text.replace(/\:\s+/g, ':\n'); // Add a line break after colons

    return text;
}

// Function to download the text as a .txt file
function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}