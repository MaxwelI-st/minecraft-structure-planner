const fs = require('fs');
const logPath = "C:\\Users\\maita\\.gemini\\antigravity\\brain\\df64e5f4-a47b-44b3-8ead-a69a43e7222d\\.system_generated\\logs\\overview.txt";

try {
    const log = fs.readFileSync(logPath, 'utf8');
    
    // 巨大な BLOCK_CATALOG の定義を探す
    // multi_replace_file_content の引数内にある \n 混じりの文字列を抽出
    const startPattern = "const BLOCK_CATALOG = [";
    const endPattern = "];";
    
    let startIndex = log.lastIndexOf(startPattern);
    if (startIndex === -1) {
        console.log('Could not find start of catalog.');
        process.exit(1);
    }
    
    let endIndex = log.indexOf(endPattern, startIndex);
    if (endIndex === -1) {
        console.log('Could not find end of catalog.');
        process.exit(1);
    }
    
    let catalog = log.substring(startIndex, endIndex + endPattern.length);
    
    // ログ内ではエスケープされている可能性があるため、アンエスケープ
    catalog = catalog.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    
    fs.writeFileSync('scratch/extracted_catalog.js', catalog, 'utf8');
    console.log('Extracted catalog to scratch/extracted_catalog.js. Length:', catalog.length);
} catch (err) {
    console.error('Error:', err);
}
