const fs = require('fs');

const file = 'src/styles/globals.scss';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 1. Remove exact ranges (0-indexed)
const rangesToRemove = [
    [1142, 1524], // AdminDashboard old
    [3567, 3820], // NavBar old
    [7304, 7410], // CoursePlayer Missing Classes
];

// Mark lines for deletion
const toDelete = new Set();
for (const [start, end] of rangesToRemove) {
    for (let i = start; i <= end; i++) {
        toDelete.add(i);
    }
}

// 2. Remove duplicate CoursePlayer classes from Chunk 1
const sharedClasses = [
    '.CoursePlayer-layout',
    '.CoursePlayer-videoArea',
    '.CoursePlayer-sidebar',
    '.CoursePlayer-sidebarHidden',
    '.CoursePlayer-sidebarHead',
    '.CoursePlayer-sectionsList',
    '.CoursePlayer-section',
    '.CoursePlayer-sectionTitle',
    '.CoursePlayer-lessonRow',
    '.CoursePlayer-lessonActive',
    '.CoursePlayer-lessonDone',
    '.CoursePlayer-lessonCheck',
    '.CoursePlayer-lessonName',
    '.CoursePlayer-emptyLessons'
];

// Find and mark them in Chunk 1 (lines 2050 to 2300 roughly)
// We will iterate through lines, if we find a class, we mark lines until '}'
let inSharedClass = false;
let braceCount = 0;

for (let i = 2050; i <= 2300; i++) {
    if (toDelete.has(i)) continue;
    
    const line = lines[i];
    if (line === undefined) continue;

    if (!inSharedClass) {
        for (const cls of sharedClasses) {
            if (line.startsWith(cls + ' ') || line.startsWith(cls + '{') || line === cls) {
                inSharedClass = true;
                braceCount = 0;
                break;
            }
        }
    }

    if (inSharedClass) {
        toDelete.add(i);
        // Also remove preceding empty line or comment if any (simplistic)
        if (i > 0 && (lines[i-1] === '' || lines[i-1].startsWith('/*'))) {
            toDelete.add(i-1);
        }

        if (line.includes('{')) braceCount += (line.match(/\{/g) || []).length;
        if (line.includes('}')) braceCount -= (line.match(/\}/g) || []).length;

        if (braceCount === 0 && line.includes('}')) {
            inSharedClass = false;
        }
    }
}

const newLines = lines.filter((_, i) => !toDelete.has(i));
fs.writeFileSync(file, newLines.join('\n'));
console.log('Cleaned globals.scss!');
