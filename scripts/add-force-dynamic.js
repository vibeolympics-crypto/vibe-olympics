/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');
const DYNAMIC_EXPORT = "export const dynamic = 'force-dynamic';";

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 이미 dynamic export가 있으면 스킵
  if (content.includes("export const dynamic")) {
    return { skipped: true, file: filePath };
  }
  
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  // 마지막 import 라인 찾기
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    // import가 없으면 파일 맨 위에 추가
    lines.unshift(DYNAMIC_EXPORT, '');
  } else {
    // 마지막 import 다음 줄에 추가
    lines.splice(lastImportIndex + 1, 0, '', DYNAMIC_EXPORT);
  }
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  return { updated: true, file: filePath };
}

function walkDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, results);
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  }
  
  return results;
}

// 실행
const apiFiles = walkDir(API_DIR);
console.log(`Found ${apiFiles.length} API route files`);

let updated = 0;
let skipped = 0;
let failed = 0;

for (const file of apiFiles) {
  const result = processFile(file);
  if (result.updated) {
    console.log(`✅ Updated: ${path.relative(API_DIR, file)}`);
    updated++;
  } else if (result.skipped) {
    console.log(`⏭️  Skipped: ${path.relative(API_DIR, file)} (already has dynamic)`);
    skipped++;
  } else {
    console.log(`❌ Failed: ${path.relative(API_DIR, file)}`);
    failed++;
  }
}

console.log(`\n===== Summary =====`);
console.log(`Updated: ${updated}`);
console.log(`Skipped: ${skipped}`);
console.log(`Failed: ${failed}`);
